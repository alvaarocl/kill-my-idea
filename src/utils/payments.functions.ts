import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { PaddleEnv } from "@/lib/paddle.server";

const envSchema = z.enum(["sandbox", "live"]);
const priceIdSchema = z.enum(["single_report_once", "founder_monthly", "pro_monthly"]);

export type PriceId = "single_report_once" | "founder_monthly" | "pro_monthly";

/**
 * Resolve the actual Paddle price ID for a logical price key, per environment.
 * Env vars: PADDLE_SANDBOX_PRICE_* for sandbox, PADDLE_LIVE_PRICE_* for live.
 * Falls back to the legacy single-env vars for backward compatibility during migration.
 */
export function getServerPriceId(logicalId: PriceId, env: PaddleEnv): string {
  const prefix = env === "sandbox" ? "PADDLE_SANDBOX_PRICE" : "PADDLE_LIVE_PRICE";

  const perEnvMap: Record<PriceId, string> = {
    single_report_once: process.env[`${prefix}_SINGLE_REPORT`] ?? "",
    founder_monthly: process.env[`${prefix}_FOUNDER_MONTHLY`] ?? "",
    pro_monthly: process.env[`${prefix}_PRO_MONTHLY`] ?? "",
  };

  // Fallback to legacy single-env vars (PADDLE_PRICE_*) while people migrate secrets
  const legacyMap: Record<PriceId, string> = {
    single_report_once: process.env.PADDLE_PRICE_SINGLE_REPORT ?? "",
    founder_monthly: process.env.PADDLE_PRICE_FOUNDER_MONTHLY ?? "",
    pro_monthly: process.env.PADDLE_PRICE_PRO_MONTHLY ?? "",
  };

  return perEnvMap[logicalId] || legacyMap[logicalId] || "";
}

export const resolvePaddlePrice = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        priceId: priceIdSchema,
        environment: envSchema,
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const id = getServerPriceId(data.priceId, data.environment);
    if (!id) throw new Error(`Price not found or not configured: ${data.priceId}`);
    return id;
  });

export const PLAN_LABELS: Record<PriceId, { name: string; price: string; cadence: string }> = {
  single_report_once: { name: "Single Report", price: "€5", cadence: "one-time" },
  founder_monthly: { name: "Founder", price: "€19", cadence: "per month" },
  pro_monthly: { name: "Pro", price: "€49", cadence: "per month" },
};
