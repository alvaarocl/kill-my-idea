import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";
import { getServerPaddleEnv } from "@/lib/paddle.server";

// Gemini 2.5 Flash direct API (2025): ~4k input × $0.075/1M + ~6k output × $0.30/1M ≈ $0.003
export const COST_PER_ANALYSIS_USD = 0.003;

export type AdminStats = {
  totals: {
    users: number;
    analyses: number;
    aiCostUsd: number;
    oneTimeRevenueCents: number;
    activeSubscriptions: number;
    mrrCents: number;
  };
  topUsers: Array<{
    userId: string;
    displayName: string | null;
    analyses: number;
    aiCostUsd: number;
    revenueCents: number;
    plan: string;
  }>;
  recentAnalyses: Array<{
    id: string;
    userId: string;
    idea: string;
    createdAt: string;
  }>;
};

const PRODUCT_MRR_CENTS: Record<string, number> = {
  founder_plan: 1900,
  pro_plan: 4900,
};

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminStats> => {
    const { userId } = context;

    // Verify admin
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    const [
      profilesCountRes,
      analysesCountRes,
      recentAnalysesRes,
      topUsersRes,
      purchasesRes,
      subsRes,
    ] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("analyses").select("id", { count: "exact", head: true }),
      supabaseAdmin
        .from("analyses")
        .select("id, user_id, idea, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabaseAdmin.rpc("get_admin_top_users", { limit_count: 25 }),
      supabaseAdmin.from("one_time_purchases").select("user_id, amount_cents"),
      supabaseAdmin.from("subscriptions").select("user_id, product_id, status, current_period_end"),
    ]);

    const recentAnalyses = recentAnalysesRes.data ?? [];
    const topUserCounts = topUsersRes.data ?? [];
    const purchases = purchasesRes.data ?? [];
    const subs = subsRes.data ?? [];
    const usersTotal = profilesCountRes.count ?? 0;
    const analysesTotal = analysesCountRes.count ?? 0;
    const topUserIds = topUserCounts.map((u) => u.user_id);
    const { data: topProfiles } = topUserIds.length
      ? await supabaseAdmin.from("profiles").select("id, display_name, plan").in("id", topUserIds)
      : { data: [] };

    const now = Date.now();
    const activeSubs = subs.filter(
      (s) =>
        ["active", "trialing", "past_due"].includes(s.status) &&
        (!s.current_period_end || new Date(s.current_period_end).getTime() > now),
    );

    const mrrCents = activeSubs.reduce((acc, s) => acc + (PRODUCT_MRR_CENTS[s.product_id] ?? 0), 0);

    const revenueByUser = new Map<string, number>();
    for (const p of purchases) {
      revenueByUser.set(p.user_id, (revenueByUser.get(p.user_id) ?? 0) + p.amount_cents);
    }

    const profileMap = new Map((topProfiles ?? []).map((p) => [p.id, p]));

    const topUsers = topUserCounts.map((u) => ({
      userId: u.user_id,
      displayName: profileMap.get(u.user_id)?.display_name ?? null,
      analyses: Number(u.analyses),
      aiCostUsd: Number(u.analyses) * COST_PER_ANALYSIS_USD,
      revenueCents: revenueByUser.get(u.user_id) ?? 0,
      plan: profileMap.get(u.user_id)?.plan ?? "free",
    }));

    return {
      totals: {
        users: usersTotal,
        analyses: analysesTotal,
        aiCostUsd: analysesTotal * COST_PER_ANALYSIS_USD,
        oneTimeRevenueCents: purchases.reduce((a, p) => a + p.amount_cents, 0),
        activeSubscriptions: activeSubs.length,
        mrrCents,
      },
      topUsers,
      recentAnalyses: recentAnalyses.map((a) => ({
        id: a.id,
        userId: a.user_id,
        idea: a.idea,
        createdAt: a.created_at,
      })),
    };
  });

// ─── listAllUsers ────────────────────────────────────────────────────────────

export type AdminUser = {
  userId: string;
  email: string | null;
  displayName: string | null;
  plan: string;
  analyses: number;
  revenueCents: number;
  createdAt: string;
  isAdmin: boolean;
};

export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        search: z.string().optional(),
        page: z.number().optional().default(0),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }): Promise<{ users: AdminUser[]; total: number }> => {
    const { userId } = context;
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    const PAGE_SIZE = 50;
    const offset = data.page * PAGE_SIZE;

    let profilesQuery = supabaseAdmin
      .from("profiles")
      .select("id, display_name, plan, created_at", { count: "exact" });

    if (data.search) {
      profilesQuery = profilesQuery.ilike("display_name", `%${data.search}%`);
    }

    const { data: profiles, count } = await profilesQuery
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)
      .returns<{ id: string; display_name: string | null; plan: string; created_at: string }[]>();

    if (!profiles?.length) return { users: [], total: count ?? 0 };

    const userIds = profiles.map((p) => p.id);

    const [analysesRes, purchasesRes, authUserEntries, adminRolesRes] = await Promise.all([
      supabaseAdmin.from("analyses").select("user_id").in("user_id", userIds),
      supabaseAdmin
        .from("one_time_purchases")
        .select("user_id, amount_cents")
        .in("user_id", userIds),
      Promise.all(
        userIds.map(async (id) => {
          const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
          return [id, error ? null : (data.user?.email ?? null)] as const;
        }),
      ),
      supabaseAdmin.from("user_roles").select("user_id").eq("role", "admin").in("user_id", userIds),
    ]);

    const emailByUser = new Map(authUserEntries);

    const adminUserIds = new Set((adminRolesRes.data ?? []).map((r) => r.user_id));

    const analysesByUser = new Map<string, number>();
    const revenueByUser = new Map<string, number>();
    for (const a of analysesRes.data ?? []) {
      analysesByUser.set(a.user_id, (analysesByUser.get(a.user_id) ?? 0) + 1);
    }
    for (const p of purchasesRes.data ?? []) {
      revenueByUser.set(p.user_id, (revenueByUser.get(p.user_id) ?? 0) + p.amount_cents);
    }

    const users: AdminUser[] = profiles.map((p) => ({
      userId: p.id,
      email: emailByUser.get(p.id) ?? null,
      displayName: p.display_name,
      plan: p.plan ?? "free",
      analyses: analysesByUser.get(p.id) ?? 0,
      revenueCents: revenueByUser.get(p.id) ?? 0,
      createdAt: p.created_at,
      isAdmin: adminUserIds.has(p.id),
    }));

    return { users, total: count ?? 0 };
  });

// ─── listAllAnalyses ─────────────────────────────────────────────────────────

export type AdminAnalysis = {
  id: string;
  userId: string;
  displayName: string | null;
  idea: string;
  verdict: string | null;
  score: number | null;
  unlocked: boolean;
  createdAt: string;
};

// ─── setUserRole ─────────────────────────────────────────────────────────────

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), makeAdmin: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { userId: callerId } = context;

    // Verify caller is admin
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (!callerRole) throw new Error("Forbidden");

    // Anti-lockout: cannot remove your own admin role
    if (data.userId === callerId && !data.makeAdmin) {
      throw new Error("You cannot remove your own admin role.");
    }

    if (data.makeAdmin) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.userId, role: "admin" }, { onConflict: "user_id,role" });
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", "admin");
      if (error) throw new Error(error.message);
    }

    return { ok: true };
  });

export const listAllAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        verdict: z.enum(["ship", "pivot", "kill", "all"]).optional().default("all"),
        unlocked: z.enum(["all", "true", "false"]).optional().default("all"),
        page: z.number().optional().default(0),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }): Promise<{ analyses: AdminAnalysis[]; total: number }> => {
    const { userId } = context;
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    const PAGE_SIZE = 50;
    const offset = data.page * PAGE_SIZE;

    let query = supabaseAdmin
      .from("analyses")
      .select("id, user_id, idea, verdict, score, unlocked, created_at", { count: "exact" });

    if (data.verdict !== "all") query = query.eq("verdict", data.verdict);
    if (data.unlocked === "true") query = query.eq("unlocked", true);
    if (data.unlocked === "false") query = query.eq("unlocked", false);

    const { data: analyses, count } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (!analyses?.length) return { analyses: [], total: count ?? 0 };

    const userIds = [...new Set(analyses.map((a) => a.user_id))];
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);
    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

    return {
      analyses: analyses.map((a) => ({
        id: a.id,
        userId: a.user_id,
        displayName: profileMap.get(a.user_id) ?? null,
        idea: a.idea,
        verdict: a.verdict,
        score: a.score,
        unlocked: a.unlocked ?? false,
        createdAt: a.created_at,
      })),
      total: count ?? 0,
    };
  });

// ─── getAdminPaymentData ──────────────────────────────────────────────────────

export type AdminPaymentSummary = {
  environment: string;
  recentPurchases: Array<{
    id: string;
    userId: string;
    email: string | null;
    priceId: string;
    amountCents: number;
    currency: string;
    analysisId: string | null;
    createdAt: string;
  }>;
  recentSubscriptions: Array<{
    id: string;
    userId: string;
    email: string | null;
    productId: string;
    status: string;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    createdAt: string;
  }>;
  recentEvents: Array<{
    eventId: string;
    eventType: string;
    environment: string;
    processedAt: string;
  }>;
};

export const getAdminPaymentData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminPaymentSummary> => {
    const { userId } = context;

    // Verify admin
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    const environment = getServerPaddleEnv();

    const [purchasesRes, subsRes, eventsRes] = await Promise.all([
      supabaseAdmin
        .from("one_time_purchases")
        .select("id, user_id, price_id, amount_cents, currency, analysis_id, created_at")
        .order("created_at", { ascending: false })
        .limit(25),
      supabaseAdmin
        .from("subscriptions")
        .select(
          "id, user_id, product_id, status, current_period_end, cancel_at_period_end, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(25),
      supabaseAdmin
        .from("payment_events")
        .select("event_id, event_type, environment, processed_at")
        .order("processed_at", { ascending: false })
        .limit(50),
    ]);

    if (purchasesRes.error) throw new Error(purchasesRes.error.message);
    if (subsRes.error) throw new Error(subsRes.error.message);
    if (eventsRes.error) throw new Error(eventsRes.error.message);

    // Gather unique user IDs across purchases + subs to resolve emails
    const allUserIds = [
      ...new Set([
        ...(purchasesRes.data ?? []).map((p) => p.user_id),
        ...(subsRes.data ?? []).map((s) => s.user_id),
      ]),
    ];
    const emailByUser = new Map<string, string | null>();
    await Promise.all(
      allUserIds.map(async (uid) => {
        const { data } = await supabaseAdmin.auth.admin.getUserById(uid);
        emailByUser.set(uid, data?.user?.email ?? null);
      }),
    );

    return {
      environment,
      recentPurchases: (purchasesRes.data ?? []).map((p) => ({
        id: p.id,
        userId: p.user_id,
        email: emailByUser.get(p.user_id) ?? null,
        priceId: p.price_id,
        amountCents: p.amount_cents,
        currency: p.currency,
        analysisId: p.analysis_id,
        createdAt: p.created_at,
      })),
      recentSubscriptions: (subsRes.data ?? []).map((s) => ({
        id: s.id,
        userId: s.user_id,
        email: emailByUser.get(s.user_id) ?? null,
        productId: s.product_id,
        status: s.status,
        currentPeriodEnd: s.current_period_end,
        cancelAtPeriodEnd: !!s.cancel_at_period_end,
        createdAt: s.created_at,
      })),
      recentEvents: (eventsRes.data ?? []).map((e) => ({
        eventId: e.event_id,
        eventType: e.event_type,
        environment: e.environment,
        processedAt: e.processed_at,
      })),
    };
  });
