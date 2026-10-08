import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

describe("backend security contracts", () => {
  it("monthly quota reservation is atomic", () => {
    const sql = read("supabase/migrations/20260529000000_fix_quota_and_admin_stats.sql");

    expect(sql).toContain("ON CONFLICT (user_id, period_start) DO UPDATE");
    expect(sql).toContain("WHERE public.usage_counters.analyses_used < quota_limit");
  });

  it("durable rate limit uses an atomic upsert and is service-role only", () => {
    const sql = read("supabase/migrations/20260602000000_rate_limits_and_audit.sql");

    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.rate_limits");
    expect(sql).toContain("ON CONFLICT (key_hash, window_start) DO UPDATE");
    expect(sql).toContain("WHERE public.rate_limits.count < max_requests");
    expect(sql).toContain("GRANT EXECUTE ON FUNCTION public.reserve_rate_limit");
    expect(sql).toContain("TO service_role");
  });

  it("checkout customData userId comes from verified server context, not client input", () => {
    const source = read("src/lib/billing.functions.ts");

    expect(source).toContain("const { supabase, userId } = context");
    expect(source).toContain(
      "const customData: Record<string, string> = { userId, priceId: data.priceId }",
    );
    expect(source).not.toContain("userId: z.string()");
  });
});
