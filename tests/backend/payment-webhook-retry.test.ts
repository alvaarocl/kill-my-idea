import { beforeEach, describe, expect, it, vi } from "vitest";

// payment_events: insert reserves the event id, delete releases it.
const reserve = vi.fn();
const release = vi.fn();
// one_time_purchases / analyses writes made by transaction.completed.
const purchaseUpsert = vi.fn();
const unlock = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === "payment_events") {
        return {
          insert: reserve,
          delete: () => ({ eq: () => ({ eq: release }) }),
        };
      }
      if (table === "one_time_purchases") return { upsert: purchaseUpsert };
      return { update: () => ({ eq: () => ({ eq: unlock }) }) };
    }),
    auth: { admin: { getUserById: vi.fn(async () => ({ data: { user: null } })) } },
  })),
}));

vi.mock("@/lib/paddle.server", () => ({
  EventName: { TransactionCompleted: "transaction.completed" },
  verifyWebhook: vi.fn(async () => ({
    eventId: "evt_1",
    eventType: "transaction.completed",
    data: {
      id: "txn_1",
      customerId: "ctm_1",
      items: [{ price: { id: "pri_single", unitPrice: { amount: "500", currencyCode: "EUR" } } }],
      customData: { userId: "user_1", analysisId: "analysis_1" },
    },
  })),
}));

vi.mock("@/utils/payments.functions", () => ({
  getServerPriceId: (id: string) => (id === "single_report_once" ? "pri_single" : "other"),
}));

vi.mock("@/lib/email.server", () => ({ sendEmail: vi.fn() }));

describe("payment webhook retries", () => {
  beforeEach(() => {
    vi.resetModules();
    for (const fn of [reserve, release, purchaseUpsert, unlock]) fn.mockReset();
    reserve.mockResolvedValue({ error: null });
    release.mockResolvedValue({ error: null });
    unlock.mockResolvedValue({ error: null });
  });

  it("records the purchase and unlocks the report", async () => {
    purchaseUpsert.mockResolvedValue({ error: null });
    const { handleWebhook } = await import("@/routes/api/public/payments/webhook");

    await handleWebhook(new Request("https://x/"), "sandbox");

    expect(purchaseUpsert).toHaveBeenCalledOnce();
    expect(unlock).toHaveBeenCalledOnce();
    expect(release).not.toHaveBeenCalled();
  });

  it("releases the event when a write fails, so Paddle's retry is processed", async () => {
    purchaseUpsert.mockResolvedValue({ error: { message: "connection reset" } });
    const { handleWebhook } = await import("@/routes/api/public/payments/webhook");

    await expect(handleWebhook(new Request("https://x/"), "sandbox")).rejects.toThrow(
      "connection reset",
    );
    expect(release).toHaveBeenCalledOnce();
    expect(unlock).not.toHaveBeenCalled();
  });
});
