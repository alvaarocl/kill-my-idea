import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();

vi.mock("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    auth: { getUser },
  },
}));

describe("verifySupabaseAccessToken", () => {
  beforeEach(() => {
    getUser.mockReset();
  });

  it("rejects forged or invalid tokens because Supabase verification fails", async () => {
    const { verifySupabaseAccessToken } = await import("@/integrations/supabase/auth-user.server");
    getUser.mockResolvedValue({
      data: { user: null },
      error: { message: "invalid JWT" },
    });

    await expect(verifySupabaseAccessToken("forged.jwt.token")).resolves.toBeNull();
    expect(getUser).toHaveBeenCalledWith("forged.jwt.token");
  });

  it("returns the verified Supabase user id and email", async () => {
    const { verifySupabaseAccessToken } = await import("@/integrations/supabase/auth-user.server");
    getUser.mockResolvedValue({
      data: { user: { id: "user-1", email: "founder@example.com" } },
      error: null,
    });

    await expect(verifySupabaseAccessToken("valid.jwt.token")).resolves.toMatchObject({
      id: "user-1",
      email: "founder@example.com",
    });
  });
});
