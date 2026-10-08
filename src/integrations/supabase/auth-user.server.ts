import { supabaseAdmin } from "./client.server";

export type VerifiedSupabaseUser = {
  id: string;
  email: string | null;
  tokenPayload: Record<string, unknown>;
};

export function extractBearerToken(authHeader: string | null | undefined): string {
  if (!authHeader) return "";
  return authHeader.match(/Bearer\s+([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/i)?.[1] ?? "";
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const payloadB64 = token.split(".")[1];
  if (!payloadB64) return {};
  try {
    const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export async function verifySupabaseAccessToken(
  token: string,
): Promise<VerifiedSupabaseUser | null> {
  if (!token) return null;

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user?.id) {
    console.error("Supabase access token validation failed", { message: error?.message });
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    tokenPayload: decodeJwtPayload(token),
  };
}

export function getTokenAgeSeconds(payload: Record<string, unknown>): number | null {
  const authTime = typeof payload.auth_time === "number" ? payload.auth_time : null;
  const issuedAt = typeof payload.iat === "number" ? payload.iat : null;
  const timestamp = authTime ?? issuedAt;
  if (!timestamp) return null;
  return Math.max(0, Math.floor(Date.now() / 1000) - timestamp);
}
