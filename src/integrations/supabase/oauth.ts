import { supabase } from "./client";

type SignInOptions = {
  redirect_uri?: string;
};

type OAuthProvider = "google" | "github" | "apple" | "microsoft";

export const oauth = {
  auth: {
    signInWithOAuth: async (provider: OAuthProvider, opts?: SignInOptions) => {
      const redirectTo = opts?.redirect_uri ?? window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as Parameters<typeof supabase.auth.signInWithOAuth>[0]["provider"],
        options: { redirectTo },
      });
      if (error) return { error, redirected: false };
      return { error: null, redirected: true };
    },
  },
};
