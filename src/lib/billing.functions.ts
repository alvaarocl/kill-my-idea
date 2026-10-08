import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getPaddleClient, getServerPaddleEnv, type PaddleEnv } from "@/lib/paddle.server";
import { getServerPriceId, type PriceId } from "@/utils/payments.functions";

export type MySubscriptionSummary = {
  hasSubscription: boolean;
  status: string | null;
  productId: string | null;
  priceId: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  environment: PaddleEnv | null;
  paddleSubscriptionId: string | null;
  paddleCustomerId: string | null;
};

// ─── createCheckoutTransaction ───────────────────────────────────────────────
// Server-side Paddle transaction creation — custom_data is set here, never from the client.
// This prevents users from spoofing userId or unlocking other users' analyses.

export const createCheckoutTransaction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        priceId: z.enum(["single_report_once", "founder_monthly", "pro_monthly"]),
        analysisId: z.string().uuid().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<{ transactionId: string }> => {
    const { supabase, userId } = context;

    if (data.priceId === "single_report_once") {
      if (!data.analysisId) throw new Error("analysisId is required for single report purchase");
      const { data: analysis, error } = await supabase
        .from("analyses")
        .select("id, unlocked")
        .eq("id", data.analysisId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error || !analysis) throw new Error("Analysis not found or access denied");
      if (analysis.unlocked) throw new Error("This analysis is already unlocked");
    }

    const env = getServerPaddleEnv();
    const paddlePriceId = getServerPriceId(data.priceId as PriceId, env);
    if (!paddlePriceId) {
      throw new Error(
        `Paddle price not configured for ${data.priceId} in ${env}. Set PADDLE_${env.toUpperCase()}_PRICE_* env vars.`,
      );
    }

    const paddle = getPaddleClient(env);
    const customData: Record<string, string> = { userId, priceId: data.priceId };
    if (data.analysisId) customData.analysisId = data.analysisId;

    await supabaseAdmin.from("audit_log").insert({
      actor_user_id: userId,
      action: "checkout.create",
      metadata: {
        priceId: data.priceId,
        analysisId: data.analysisId ?? null,
        environment: env,
      },
    });

    const transaction = await paddle.transactions.create({
      items: [{ priceId: paddlePriceId, quantity: 1 }],
      customData,
      collectionMode: "automatic",
    });

    return { transactionId: transaction.id };
  });

export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MySubscriptionSummary> => {
    const { supabase, userId } = context;
    const currentEnv = getServerPaddleEnv();
    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        "status, product_id, price_id, current_period_end, cancel_at_period_end, environment, paddle_subscription_id, paddle_customer_id",
      )
      .eq("user_id", userId)
      .eq("environment", currentEnv)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      return {
        hasSubscription: false,
        status: null,
        productId: null,
        priceId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        environment: null,
        paddleSubscriptionId: null,
        paddleCustomerId: null,
      };
    }
    return {
      hasSubscription: true,
      status: data.status,
      productId: data.product_id,
      priceId: data.price_id,
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: !!data.cancel_at_period_end,
      environment: data.environment as PaddleEnv,
      paddleSubscriptionId: data.paddle_subscription_id,
      paddleCustomerId: data.paddle_customer_id,
    };
  });

export const createPortalSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ url: string }> => {
    const { supabase, userId } = context;
    const currentEnv = getServerPaddleEnv();
    const { data: sub, error } = await supabase
      .from("subscriptions")
      .select("paddle_customer_id, paddle_subscription_id, environment")
      .eq("user_id", userId)
      .eq("environment", currentEnv)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!sub?.paddle_customer_id) {
      throw new Error("No subscription found");
    }
    const env = (sub.environment ?? "sandbox") as PaddleEnv;
    const paddle = getPaddleClient(env);
    const session = await paddle.customerPortalSessions.create(
      sub.paddle_customer_id,
      sub.paddle_subscription_id ? [sub.paddle_subscription_id] : [],
    );
    const url =
      session?.urls?.general?.overview ?? session?.urls?.subscriptions?.[0]?.cancelSubscription;
    if (!url) throw new Error("Portal URL unavailable");
    return { url };
  });
