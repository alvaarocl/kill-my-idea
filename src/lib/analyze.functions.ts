import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  extractBearerToken,
  verifySupabaseAccessToken,
} from "@/integrations/supabase/auth-user.server";
import { getServerPaddleEnv } from "@/lib/paddle.server";
import { prompts } from "@/lib/prompts";

// Quota per plan per calendar month. Pro and admin have no hard limit (handled separately).
const PLAN_QUOTA: Record<string, number> = { free: 1, founder: 20 };

// Durable rate limits are reserved through Supabase to protect AI spend across Workers.
const DEMO_MAX = 5;
const AUTHENTICATED_MAX_PER_HOUR = 30;
const PRO_MAX_PER_HOUR = 120;
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

async function sha256Base64Url(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = [...new Uint8Array(digest)];
  const binary = bytes.map((b) => String.fromCharCode(b)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function reserveRateLimit(rawKey: string, maxRequests: number): Promise<boolean> {
  const keyHash = await sha256Base64Url(rawKey);
  const { data, error } = await supabaseAdmin.rpc("reserve_rate_limit", {
    limit_key_hash: keyHash,
    window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    max_requests: maxRequests,
  });
  if (error) {
    console.error("Rate limit reservation failed", error);
    throw new Error("Rate limit temporarily unavailable. Try again in a minute.");
  }
  return !!data;
}

const inputSchema = z.object({
  idea: z.string().trim().min(10).max(2000),
  lang: z.enum(["en", "es"]).optional().default("en"),
  market: z.string().trim().max(120).optional(),
  context: z.string().trim().max(2000).optional(),
  one_liner: z.string().trim().max(280).optional(),
  problem: z.string().trim().max(1000).optional(),
  target_customer: z.string().trim().max(500).optional(),
  business_model: z.string().trim().max(500).optional(),
  stage: z.string().trim().max(120).optional(),
  team: z.string().trim().max(500).optional(),
  competition: z.string().trim().max(1000).optional(),
  mode: z.enum(["demo", "personal"]).optional().default("personal"),
  authToken: z.string().trim().optional(),
});

export type Competitor = {
  name: string;
  type: "indie" | "startup" | "scaleup" | "incumbent" | "bigtech" | "open_source";
  funding: string;
  strength: string;
  weakness: string;
  threat_level: number;
};

export type Persona = {
  name: string;
  who: string;
  pain: string;
  willingness_to_pay: string;
  where_to_find: string;
};

export type BigTechThreat = {
  company: string;
  reason: string;
  likelihood: "low" | "medium" | "high";
  timeline: string;
};

export type DeadCompany = { name: string; what: string; died: string; cause: string };

export type PricingTier = { name: string; price: string; includes: string };

export type Channel = { name: string; why: string; effort: "low" | "medium" | "high" };

export type Risk = {
  category: "legal" | "technical" | "market" | "team" | "financial";
  risk: string;
  mitigation: string;
  severity: "low" | "medium" | "high" | "critical";
};

export type KillResult = {
  one_liner: string;
  category: string;
  quote: string;
  roast: string;
  scores: {
    market_size: number;
    competition: number;
    execution: number;
    timing: number;
    originality: number;
    moat: number;
    demand: number;
    monetization: number;
    scalability: number;
    regulatory: number;
    virality: number;
    founder_fit: number;
  };
  verdict: "ship" | "pivot" | "kill";
  verdict_summary: string;
  market: {
    tam: string;
    sam: string;
    som: string;
    growth: string;
    maturity: "emerging" | "growing" | "mature" | "declining";
    target_customer: string;
    geographies: string[];
    trends: string[];
    red_flags: string[];
  };
  personas: Persona[];
  competitors: Competitor[];
  bigtech_threats: BigTechThreat[];
  similar_dead: DeadCompany[];
  business_model: {
    revenue_streams: string[];
    pricing_tiers: PricingTier[];
    unit_economics: {
      cac_estimate: string;
      ltv_estimate: string;
      gross_margin: string;
      payback_period: string;
    };
  };
  gtm: {
    channels: Channel[];
    first_100_users: string;
    content_angles: string[];
    wedge: string;
  };
  tech_stack: {
    frontend: string;
    backend: string;
    database: string;
    ai: string;
    infra: string;
    integrations: string[];
    rationale: string;
    build_time: string;
  };
  mvp_prompt: string;
  roadmap: {
    week_1: string[];
    month_1: string[];
    month_3: string[];
    month_6: string[];
    year_1: string[];
  };
  risks: Risk[];
  kill_switches: string[];
  name_suggestions: { name: string; rationale: string }[];
  survival_kit: string[];
};

/**
 * Returns a type-complete KillResult with all paywalled fields zeroed out.
 * Free fields kept: one_liner, category, quote, roast, verdict, verdict_summary, scores.
 * This is what gets sent to locked (free-tier) clients — no premium content leaves the server.
 */
export function redactResult(r: KillResult): KillResult {
  return {
    one_liner: r.one_liner,
    category: r.category,
    quote: r.quote,
    roast: r.roast,
    scores: r.scores,
    verdict: r.verdict,
    verdict_summary: r.verdict_summary,
    // Paywalled fields — empty but type-valid
    market: {
      tam: "",
      sam: "",
      som: "",
      growth: "",
      maturity: "emerging",
      target_customer: "",
      geographies: [],
      trends: [],
      red_flags: [],
    },
    personas: [],
    competitors: [],
    bigtech_threats: [],
    similar_dead: [],
    business_model: {
      revenue_streams: [],
      pricing_tiers: [],
      unit_economics: { cac_estimate: "", ltv_estimate: "", gross_margin: "", payback_period: "" },
    },
    gtm: { channels: [], first_100_users: "", content_angles: [], wedge: "" },
    tech_stack: {
      frontend: "",
      backend: "",
      database: "",
      ai: "",
      infra: "",
      integrations: [],
      rationale: "",
      build_time: "",
    },
    mvp_prompt: "",
    roadmap: { week_1: [], month_1: [], month_3: [], month_6: [], year_1: [] },
    risks: [],
    kill_switches: [],
    name_suggestions: [],
    survival_kit: [],
  };
}

export const killIdea = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(
    async ({
      data,
    }): Promise<{ result: KillResult; locked: boolean; analysisId: string | null }> => {
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) throw new Error("AI is not configured");

      // --- Demo rate limiting (no auth, durable cost protection) ---
      if (data.mode === "demo") {
        const request = getRequest();
        const ip =
          request?.headers?.get("cf-connecting-ip") ??
          request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          "unknown";
        const allowed = await reserveRateLimit(`demo:${ip}`, DEMO_MAX);
        if (!allowed) {
          throw new Error("Demo limit reached. Sign in to analyse more ideas.");
        }
      }

      // --- Auth check (personal mode only, before calling AI) ---
      let userId: string | null = null;
      let plan: "free" | "pro" | "founder" = "free";
      let isAdmin = false;
      let hasUnlimitedQuota = false;
      let _periodStartStr: string | null = null;
      let quotaReserved = false;

      if (data.mode === "personal") {
        const request = getRequest();
        const authHeader = request?.headers?.get("authorization") ?? "";
        const token = extractBearerToken(authHeader) || data.authToken?.trim() || "";
        if (!token) throw new Error("No active browser session found. Please sign in again.");
        const verified = await verifySupabaseAccessToken(token);
        userId = verified?.id ?? null;
        if (!verified || !userId) {
          console.error("Personal analysis auth rejected", {
            hasAuthHeader: !!authHeader,
            hasPayloadToken: !!data.authToken,
          });
          throw new Error("Your session could not be verified. Please sign in again.");
        }

        // Check admin role — admins get unlimited analyses and full reports
        const { data: adminRow } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .maybeSingle();
        isAdmin = !!adminRow;

        const now = new Date().toISOString();
        const currentPaymentEnv = getServerPaddleEnv();
        const { data: subs } = await supabaseAdmin
          .from("subscriptions")
          .select("product_id, status, current_period_end")
          .eq("user_id", userId)
          .eq("environment", currentPaymentEnv)
          .in("status", ["active", "trialing", "past_due"])
          .gt("current_period_end", now)
          .order("created_at", { ascending: false })
          .limit(1);
        plan =
          subs?.[0]?.product_id === "pro_plan"
            ? "pro"
            : subs?.[0]?.product_id === "founder_plan"
              ? "founder"
              : "free";

        const hourlyLimit =
          isAdmin || plan === "pro" ? PRO_MAX_PER_HOUR : AUTHENTICATED_MAX_PER_HOUR;
        const allowed = await reserveRateLimit(`user:${userId}`, hourlyLimit);
        if (!allowed) {
          throw new Error("Hourly analysis limit reached. Try again later.");
        }

        // Atomic quota reservation — admins and pro users have no hard limit
        hasUnlimitedQuota = isAdmin || plan === "pro";
        const d = new Date();
        _periodStartStr = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
          .toISOString()
          .slice(0, 10);
        if (!hasUnlimitedQuota) {
          const quota = PLAN_QUOTA[plan] ?? 1;
          const { data: reservedCount, error: reserveErr } = await supabaseAdmin.rpc(
            "reserve_analysis_quota",
            {
              user_uuid: userId!,
              period_start_date: _periodStartStr,
              quota_limit: quota,
            },
          );
          if (reserveErr) throw new Error(reserveErr.message);
          if (!reservedCount) {
            throw new Error(
              plan === "free"
                ? "You've used your free monthly analysis. Upgrade to get more."
                : `Monthly limit of ${quota} analyses reached.`,
            );
          }
          quotaReserved = true;
        }
      }

      try {
        // --- AI call ---
        const { system: systemPrompt, user: userPrompt } = prompts.build({
          lang: data.lang,
          idea: data.idea,
          market: data.market,
          context: data.context,
        });

        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
          {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "gemini-2.5-flash",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              tools: [
                {
                  type: "function",
                  function: {
                    name: "submit_analysis",
                    description: "Submit the full forensic autopsy of the startup idea.",
                    parameters: prompts.analysisJsonSchema,
                  },
                },
              ],
              tool_choice: { type: "function", function: { name: "submit_analysis" } },
            }),
          },
        );

        if (!response.ok) {
          if (response.status === 429)
            throw new Error("Slow down — rate limit hit. Try again in a minute.");
          if (response.status === 503)
            throw new Error("AI model temporarily unavailable. Try again in a few seconds.");
          if (response.status === 402) throw new Error("AI credits exhausted.");
          const text = await response.text();
          console.error("AI gateway error", response.status, text);
          throw new Error(`AI error (${response.status})`);
        }

        const raw = await response.json();
        const toolCall = raw.choices?.[0]?.message?.tool_calls?.[0];
        if (!toolCall?.function?.arguments) throw new Error("No analysis returned");

        // Runtime validation: ensure the AI returned the critical fields with correct types
        const _aiResultRaw = JSON.parse(toolCall.function.arguments);
        const _aiValidation = z
          .object({
            verdict: z.enum(["ship", "pivot", "kill"]),
            scores: z.object({
              market_size: z.number(),
              competition: z.number(),
              execution: z.number(),
              timing: z.number(),
              originality: z.number(),
              moat: z.number(),
              demand: z.number(),
              monetization: z.number(),
              scalability: z.number(),
              regulatory: z.number(),
              virality: z.number(),
              founder_fit: z.number(),
            }),
            roast: z.string(),
            one_liner: z.string(),
            market: z.object({
              tam: z.string(),
              sam: z.string(),
              som: z.string(),
              growth: z.string(),
              maturity: z.string(),
              target_customer: z.string(),
              geographies: z.array(z.string()),
              trends: z.array(z.string()),
              red_flags: z.array(z.string()),
            }),
            competitors: z.array(
              z.object({
                name: z.string(),
                type: z.string(),
                funding: z.string(),
                strength: z.string(),
                weakness: z.string(),
                threat_level: z.number(),
              }),
            ),
            survival_kit: z.array(z.string()),
            kill_switches: z.array(z.string()),
          })
          .passthrough()
          .safeParse(_aiResultRaw);
        if (!_aiValidation.success) {
          console.error("AI response failed validation", _aiValidation.error.flatten());
          throw new Error("AI returned an unexpected response format. Please try again.");
        }
        const aiResult = _aiValidation.data as KillResult;

        // --- Demo mode: return immediately ---
        if (data.mode === "demo") {
          return { result: aiResult, locked: false, analysisId: null };
        }

        // --- Personal mode: save to DB ---
        const scores = aiResult.scores;
        const vals = Object.values(scores) as number[];
        const avgScore = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);

        const { data: saved, error: insertErr } = await supabaseAdmin
          .from("analyses")
          .insert({
            user_id: userId!,
            idea: data.idea,
            lang: data.lang ?? "en",
            market: data.market ?? null,
            context: data.context ?? null,
            result_json: aiResult as unknown as import("@/integrations/supabase/types").Json,
            score: avgScore,
            verdict: aiResult.verdict,
            one_liner: aiResult.one_liner,
            unlocked: hasUnlimitedQuota || plan !== "free",
          })
          .select("id")
          .single();
        if (insertErr) throw new Error(insertErr.message);

        const locked = plan === "free" && !hasUnlimitedQuota;
        return {
          result: locked ? redactResult(aiResult) : aiResult,
          locked,
          analysisId: saved?.id ?? null,
        };
      } catch (err) {
        if (quotaReserved && userId && _periodStartStr) {
          const { error: releaseErr } = await supabaseAdmin.rpc("release_analysis_quota", {
            user_uuid: userId,
            period_start_date: _periodStartStr,
          });
          if (releaseErr) console.error("Failed to release analysis quota", releaseErr);
        }
        throw err;
      }
    },
  );
