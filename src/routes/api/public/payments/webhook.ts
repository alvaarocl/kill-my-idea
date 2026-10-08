import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { verifyWebhook, EventName, type PaddleEnv } from "@/lib/paddle.server";
import { getServerPriceId, type PriceId } from "@/utils/payments.functions";
import { sendEmail } from "@/lib/email.server";
import type { Database } from "@/integrations/supabase/types";

// Subset of the Paddle SDK notifications we read. The SDK uses null for absent values.
type PaddleWebhookData = {
  id?: string | null;
  customerId?: string | null;
  items?: Array<{
    price?: {
      id?: string | null;
      unitPrice?: {
        amount?: string | number | null;
        currencyCode?: string | null;
      } | null;
    } | null;
  }> | null;
  status?: string | null;
  currentBillingPeriod?: {
    startsAt?: string | null;
    endsAt?: string | null;
  } | null;
  scheduledChange?: {
    action?: string | null;
  } | null;
  customData?: Record<string, unknown> | null;
  subscriptionId?: string | null;
};

const asString = (v: unknown): string | undefined =>
  typeof v === "string" && v.length > 0 ? v : undefined;

/** Supabase returns errors instead of throwing; a lost write must fail the webhook so Paddle retries. */
function must(result: { error: { message: string } | null }, what: string) {
  if (result.error) throw new Error(`${what}: ${result.error.message}`);
}

let _supabase: ReturnType<typeof createClient<Database>> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

/**
 * Resolve logical priceId/productId from a raw Paddle price ID, using
 * per-environment env vars. This is the authoritative mapping — never
 * trust product identifiers that come from the client/customData.
 */
function resolvePaddlePriceIds(
  paddlePriceId: string,
  env: PaddleEnv,
): { priceId: string; productId: string } | null {
  const logical: PriceId[] = ["single_report_once", "founder_monthly", "pro_monthly"];
  for (const id of logical) {
    if (getServerPriceId(id, env) === paddlePriceId) {
      const productId =
        id === "single_report_once"
          ? "single_report"
          : id === "founder_monthly"
            ? "founder_plan"
            : "pro_plan";
      return { priceId: id, productId };
    }
  }
  return null;
}

/** Undo dedupe() so a retry of a failed event is processed instead of skipped. */
export async function releaseDedupe(eventId: string, env: PaddleEnv) {
  const { error } = await getSupabase()
    .from("payment_events")
    .delete()
    .eq("event_id", eventId)
    .eq("environment", env);
  if (error) console.error("payment_events release error", error);
}

export async function dedupe(eventId: string, eventType: string, env: PaddleEnv): Promise<boolean> {
  const { error } = await getSupabase().from("payment_events").insert({
    event_id: eventId,
    event_type: eventType,
    environment: env,
  });
  // unique-violation = already processed
  if (error?.code === "23505") return false;
  if (error) {
    console.error("payment_events insert error", error);
    throw new Error("Could not reserve payment event idempotency key");
  }
  return true;
}

async function handleSubscriptionCreated(data: PaddleWebhookData, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, customData } = data;
  const userId = asString(customData?.userId);
  if (!userId || !id || !customerId || !status) {
    console.error("subscription.created: missing userId, id, customerId or status", { id });
    return;
  }

  const item = items?.[0];
  const paddlePriceId: string = item?.price?.id ?? "";
  const resolved = resolvePaddlePriceIds(paddlePriceId, env) ?? {
    priceId: paddlePriceId,
    productId: "unknown",
  };

  must(
    await getSupabase()
      .from("subscriptions")
      .upsert(
        {
          user_id: userId,
          paddle_subscription_id: id,
          paddle_customer_id: customerId,
          product_id: resolved.productId,
          price_id: resolved.priceId,
          status,
          current_period_start: currentBillingPeriod?.startsAt ?? null,
          current_period_end: currentBillingPeriod?.endsAt ?? null,
          environment: env,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "paddle_subscription_id" },
      ),
    "subscription.created upsert",
  );

  // Welcome email (non-blocking)
  try {
    const { data: authUser } = await getSupabase().auth.admin.getUserById(userId);
    const email = authUser?.user?.email;
    if (email) {
      const planLabel =
        resolved.productId === "pro_plan"
          ? "Pro"
          : resolved.productId === "founder_plan"
            ? "Founder"
            : "subscription";
      await sendEmail({
        to: email,
        subject: `Welcome to Kill My Idea ${planLabel} 🔪`,
        html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0a0a0a;color:#e5e5e5">
  <p style="font-family:monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#ef6733">/ Kill My Idea</p>
  <h1 style="font-size:24px;font-weight:600;margin:12px 0">Your ${planLabel} plan is active.</h1>
  <p style="color:#a1a1aa">You can now analyze ideas without mercy. Go to the app and start killing.</p>
  <a href="${process.env.SITE_URL ?? "https://killmyidea.es"}/kill" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#ef6733;color:#fff;text-decoration:none;border-radius:9999px;font-weight:600">Kill an idea →</a>
</div>`,
      });
    }
  } catch (e) {
    console.error("Failed to send welcome email", e);
  }
}

async function handleSubscriptionUpdated(data: PaddleWebhookData, env: PaddleEnv) {
  const { id, customerId, items, status, currentBillingPeriod, scheduledChange, customData } = data;

  const item = items?.[0];
  const paddlePriceId: string = item?.price?.id ?? "";
  const resolved = paddlePriceId ? resolvePaddlePriceIds(paddlePriceId, env) : null;
  if (!id) {
    console.error("subscription.updated: missing subscription id");
    return;
  }
  let userId = asString(customData?.userId);

  if (!userId) {
    const { data: existing } = await getSupabase()
      .from("subscriptions")
      .select("user_id")
      .eq("paddle_subscription_id", id)
      .eq("environment", env)
      .maybeSingle();
    userId = existing?.user_id;
  }

  if (!userId) {
    console.error("subscription.updated: missing userId and no existing subscription row", { id });
    return;
  }

  // Upsert (not update) to handle out-of-order events
  const result = await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        paddle_subscription_id: id,
        user_id: userId,
        paddle_customer_id: customerId ?? "",
        ...(resolved ? { product_id: resolved.productId, price_id: resolved.priceId } : {}),
        status,
        current_period_start: currentBillingPeriod?.startsAt ?? null,
        current_period_end: currentBillingPeriod?.endsAt ?? null,
        cancel_at_period_end: scheduledChange?.action === "cancel",
        environment: env,
        updated_at: new Date().toISOString(),
        // Upsert uses Insert type but product_id/price_id are optional on updates — cast is safe
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      { onConflict: "paddle_subscription_id", ignoreDuplicates: false },
    );
  must(result, "subscription.updated upsert");
}

async function handleSubscriptionCanceled(data: PaddleWebhookData, env: PaddleEnv) {
  if (!data.id) {
    console.error("subscription.canceled: missing subscription id");
    return;
  }
  // Respect current_period_end so users keep access until it lapses
  must(
    await getSupabase()
      .from("subscriptions")
      .update({
        status: "canceled",
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq("paddle_subscription_id", data.id)
      .eq("environment", env),
    "subscription.canceled update",
  );
}

async function handleTransactionCompleted(data: PaddleWebhookData, env: PaddleEnv) {
  // Subscription renewals also fire this event — skip them
  if (data.subscriptionId) return;

  const customData = data.customData ?? {};
  const userId = asString(customData.userId);
  const analysisId = asString(customData.analysisId);
  const transactionId = data.id;
  if (!userId || !transactionId) {
    console.error("transaction.completed: missing userId or transaction id", { id: data.id });
    return;
  }

  const item = data.items?.[0];
  const paddlePriceId: string = item?.price?.id ?? "";
  const resolved = resolvePaddlePriceIds(paddlePriceId, env) ?? {
    priceId: paddlePriceId,
    productId: "single_report",
  };

  if (resolved.priceId !== "single_report_once") {
    console.log("transaction.completed: ignoring non-single-report price", {
      paddlePriceId,
      resolved,
    });
    return;
  }

  const unitPriceAmount = Number(item?.price?.unitPrice?.amount ?? 0);
  const currency = (item?.price?.unitPrice?.currencyCode ?? "EUR").toLowerCase();
  const supabase = getSupabase();

  const { error: insertErr } = await supabase.from("one_time_purchases").upsert(
    {
      user_id: userId,
      paddle_transaction_id: transactionId,
      paddle_customer_id: data.customerId ?? "",
      price_id: resolved.priceId,
      product_id: resolved.productId,
      amount_cents: unitPriceAmount,
      currency,
      analysis_id: analysisId ?? null,
      environment: env,
    },
    { onConflict: "paddle_transaction_id" },
  );
  must({ error: insertErr }, "Failed to record one_time_purchase");

  if (analysisId) {
    const { error: unlockErr } = await supabase
      .from("analyses")
      .update({
        unlocked: true,
        unlocked_at: new Date().toISOString(),
        paddle_transaction_id: transactionId,
      })
      .eq("id", analysisId)
      .eq("user_id", userId);
    must({ error: unlockErr }, "Failed to unlock analysis");

    // Unlock confirmation email (non-blocking)
    try {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      const email = authUser?.user?.email;
      if (email && analysisId) {
        await sendEmail({
          to: email,
          subject: "Your Kill My Idea report is unlocked 🔓",
          html: `
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#0a0a0a;color:#e5e5e5">
  <p style="font-family:monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#ef6733">/ Kill My Idea</p>
  <h1 style="font-size:24px;font-weight:600;margin:12px 0">Report unlocked.</h1>
  <p style="color:#a1a1aa">Your full autopsy is ready — competitors, market research, business model, MVP prompt, and everything else that should make you reconsider.</p>
  <a href="${process.env.SITE_URL ?? "https://killmyidea.es"}/autopsy?id=${analysisId}" style="display:inline-block;margin-top:24px;padding:12px 24px;background:#ef6733;color:#fff;text-decoration:none;border-radius:9999px;font-weight:600">Open the full report →</a>
</div>`,
        });
      }
    } catch (e) {
      console.error("Failed to send unlock email", e);
    }
  }
}

class WebhookProcessingError extends Error {}

export async function handleWebhook(req: Request, env: PaddleEnv) {
  const event = await verifyWebhook(req, env);

  // Idempotency: process each event at most once
  const isNew = await dedupe(event.eventId, event.eventType, env);
  if (!isNew) {
    console.log("Duplicate webhook event, skipping", {
      eventId: event.eventId,
      eventType: event.eventType,
    });
    return;
  }

  try {
    switch (event.eventType) {
      case EventName.SubscriptionCreated:
        await handleSubscriptionCreated(event.data, env);
        break;
      case EventName.SubscriptionUpdated:
        await handleSubscriptionUpdated(event.data, env);
        break;
      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(event.data, env);
        break;
      case EventName.TransactionCompleted:
        await handleTransactionCompleted(event.data, env);
        break;
      default:
        console.log("Unhandled payment event:", event.eventType);
    }
  } catch (e) {
    // The event was reserved but not applied: release it so Paddle's retry gets processed.
    await releaseDedupe(event.eventId, env);
    throw new WebhookProcessingError(e instanceof Error ? e.message : String(e));
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const rawEnv = url.searchParams.get("env") ?? "sandbox";
        // Reject unknown env values before touching any credentials
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          return new Response("Invalid env parameter", { status: 400 });
        }
        const env = rawEnv as PaddleEnv;
        try {
          await handleWebhook(request, env);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          // 400: bad signature or payload (no point retrying). 500: processing failed, Paddle retries.
          const status = e instanceof WebhookProcessingError ? 500 : 400;
          return new Response("Webhook error", { status });
        }
      },
    },
  },
});
