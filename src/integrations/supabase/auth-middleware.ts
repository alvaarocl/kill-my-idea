import { createMiddleware } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { extractBearerToken, verifySupabaseAccessToken } from "./auth-user.server";
import { supabaseAdmin } from "./client.server";

export const requireSupabaseAuth = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const request = getRequest();
    if (!request?.headers) throw new Error("Unauthorized");

    const authHeader =
      request.headers.get("authorization") ?? request.headers.get("Authorization") ?? "";
    const token = extractBearerToken(authHeader);
    if (!token) throw new Error("Unauthorized: No bearer token");

    const verified = await verifySupabaseAccessToken(token);
    if (!verified) throw new Error("Unauthorized: Invalid or expired token");

    return next({
      context: {
        supabase: supabaseAdmin,
        userId: verified.id,
        claims: { email: verified.email ?? undefined },
      },
    });
  },
);
