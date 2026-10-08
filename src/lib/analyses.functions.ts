import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  getTokenAgeSeconds,
  verifySupabaseAccessToken,
} from "@/integrations/supabase/auth-user.server";
import { type KillResult, redactResult } from "./analyze.functions";
import { getServerPaddleEnv } from "@/lib/paddle.server";

const PLAN_QUOTA: Record<string, number> = {
  free: 1,
  founder: 20,
  // pro has no hard limit — handled via null quota
};

export type PlanTier = "free" | "founder" | "pro";

export type MyMeta = {
  userId: string;
  email: string | null;
  displayName: string | null;
  plan: PlanTier;
  isAdmin: boolean;
  used: number;
  /** null means unlimited (admin) */
  quota: number | null;
  periodStart: string;
};

function currentPeriodStart(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString().slice(0, 10);
}

function isActiveSubscription(status: string, currentPeriodEnd: string | null): boolean {
  const periodOk = !currentPeriodEnd || new Date(currentPeriodEnd).getTime() > Date.now();
  return (
    (["active", "trialing", "past_due"].includes(status) && periodOk) ||
    (status === "canceled" && !!currentPeriodEnd && periodOk)
  );
}

async function hasAccountWideFullAccess(userId: string, env: string): Promise<boolean> {
  const [{ data: adminRow }, { data: subs }] = await Promise.all([
    supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle(),
    supabaseAdmin
      .from("subscriptions")
      .select("status, current_period_end")
      .eq("user_id", userId)
      .eq("environment", env)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  return (
    !!adminRow || (subs ?? []).some((s) => isActiveSubscription(s.status, s.current_period_end))
  );
}

export const getMyMeta = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyMeta> => {
    const { supabase, userId, claims } = context;
    const currentPaymentEnv = getServerPaddleEnv();
    const [{ data: profile }, { data: subs }, adminRow] = await Promise.all([
      supabase.from("profiles").select("display_name, plan").eq("id", userId).maybeSingle(),
      supabase
        .from("subscriptions")
        .select("product_id, status, current_period_end")
        .eq("user_id", userId)
        .eq("environment", currentPaymentEnv)
        .order("created_at", { ascending: false })
        .limit(5),
      supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle(),
    ]);

    const isAdmin = !!adminRow.data;

    const activeSub = (subs ?? []).find((s) => {
      return isActiveSubscription(s.status, s.current_period_end);
    });

    let plan: PlanTier = "free";
    if (activeSub?.product_id === "pro_plan") plan = "pro";
    else if (activeSub?.product_id === "founder_plan") plan = "founder";
    else if ((profile?.plan as PlanTier) === "pro" || (profile?.plan as PlanTier) === "founder") {
      plan = profile!.plan as PlanTier;
    }

    const periodStart = currentPeriodStart();

    const { data: counter } = await supabase
      .from("usage_counters")
      .select("analyses_used")
      .eq("user_id", userId)
      .eq("period_start", periodStart)
      .maybeSingle();

    return {
      userId,
      email: (claims.email as string) ?? null,
      displayName: profile?.display_name ?? null,
      plan,
      isAdmin,
      used: counter?.analyses_used ?? 0,
      // Admins and pro users have no hard limit — null signals "unlimited" to the UI
      quota: isAdmin || plan === "pro" ? null : (PLAN_QUOTA[plan] ?? 1),
      periodStart,
    };
  });

export type AnalysisListItem = {
  id: string;
  idea: string;
  one_liner: string | null;
  score: number | null;
  verdict: string | null;
  unlocked: boolean;
  created_at: string;
};

export const listAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AnalysisListItem[]> => {
    const { supabase, userId } = context;
    const currentPaymentEnv = getServerPaddleEnv();
    const { data, error } = await supabase
      .from("analyses")
      .select("id, idea, one_liner, score, verdict, unlocked, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);

    const analysisIds = (data ?? []).map((r) => r.id);
    const [hasFullAccountAccess, purchasesRes] = await Promise.all([
      hasAccountWideFullAccess(userId, currentPaymentEnv),
      analysisIds.length
        ? supabaseAdmin
            .from("one_time_purchases")
            .select("analysis_id")
            .eq("user_id", userId)
            .eq("environment", currentPaymentEnv)
            .in("analysis_id", analysisIds)
        : Promise.resolve({ data: [] as Array<{ analysis_id: string | null }> }),
    ]);
    const purchasedIds = new Set(
      (purchasesRes.data ?? []).map((p) => p.analysis_id).filter(Boolean),
    );

    return (data ?? []).map((r) => ({
      ...r,
      unlocked: !!r.unlocked && (hasFullAccountAccess || purchasedIds.has(r.id)),
    }));
  });

export type AnalysisDetail = {
  id: string;
  idea: string;
  market: string | null;
  context: string | null;
  lang: string;
  result: KillResult;
  unlocked: boolean;
  created_at: string;
};

export const getAnalysis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<AnalysisDetail> => {
    const { supabase, userId } = context;
    const currentPaymentEnv = getServerPaddleEnv();
    const { data: row, error } = await supabase
      .from("analyses")
      .select("id, idea, market, context, lang, result_json, unlocked, created_at")
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Not found");
    const [hasFullAccountAccess, purchaseRes] = await Promise.all([
      hasAccountWideFullAccess(userId, currentPaymentEnv),
      supabaseAdmin
        .from("one_time_purchases")
        .select("id")
        .eq("user_id", userId)
        .eq("analysis_id", row.id)
        .eq("environment", currentPaymentEnv)
        .maybeSingle(),
    ]);
    const unlocked = !!row.unlocked && (hasFullAccountAccess || !!purchaseRes.data);
    const fullResult = row.result_json as KillResult;
    return {
      id: row.id,
      idea: row.idea,
      market: row.market,
      context: row.context,
      lang: row.lang,
      result: unlocked ? fullResult : redactResult(fullResult),
      unlocked,
      created_at: row.created_at,
    };
  });

export const deleteAnalysis = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("analyses")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ reauthToken: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const verified = await verifySupabaseAccessToken(data.reauthToken);
    if (!verified || verified.id !== userId) {
      throw new Error("Please re-authenticate before deleting your account.");
    }

    const ageSeconds = getTokenAgeSeconds(verified.tokenPayload);
    if (ageSeconds == null || ageSeconds > 10 * 60) {
      throw new Error("Your confirmation session is too old. Please sign in again.");
    }

    await supabaseAdmin.from("audit_log").insert({
      actor_user_id: userId,
      action: "account.delete",
      metadata: {},
    });

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export { PLAN_QUOTA };
