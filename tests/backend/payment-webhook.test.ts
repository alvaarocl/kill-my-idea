import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({ insert })),
  })),
}));

describe("payment webhook idempotency", () => {
  beforeEach(() => {
    insert.mockReset();
    vi.resetModules();
  });

  it("skips duplicate events when Supabase reports unique violation", async () => {
    insert.mockResolvedValue({ error: { code: "23505" } });
    const { dedupe } = await import("@/routes/api/public/payments/webhook");

    await expect(dedupe("evt_1", "transaction.completed", "sandbox")).resolves.toBe(false);
  });

  it("fails closed when idempotency reservation cannot be stored", async () => {
    insert.mockResolvedValue({ error: { code: "57014", message: "timeout" } });
    const { dedupe } = await import("@/routes/api/public/payments/webhook");

    await expect(dedupe("evt_1", "transaction.completed", "sandbox")).rejects.toThrow(
      "Could not reserve payment event idempotency key",
    );
  });
});
