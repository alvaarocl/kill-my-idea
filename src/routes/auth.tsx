import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { oauth } from "@/integrations/supabase/oauth";
import { useAuth } from "@/lib/auth";
import { SiteHeader, KnifeMark } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

/** Accept only same-origin paths: must start with "/" but not "//" (protocol-relative). */
function safeRedirect(value: string | undefined, fallback = "/kill"): string {
  if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return fallback;
}

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: safeRedirect(typeof search.redirect === "string" ? search.redirect : undefined),
  }),
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Sign in · Kill My Idea" },
      { name: "description", content: "Sign in or create your Kill My Idea account." },
    ],
  }),
});

const ease = [0.22, 1, 0.36, 1] as const;

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate({ to: safeRedirect(redirect) });
  }, [loading, user, navigate, redirect]);

  const handleOAuth = async (provider: "google" | "github") => {
    setError(null);
    setBusyProvider(provider);
    try {
      const safeRedir = safeRedirect(redirect);
      const result = await oauth.auth.signInWithOAuth(provider, {
        redirect_uri: `${window.location.origin}${safeRedir !== "/kill" ? `?redirect=${encodeURIComponent(safeRedir)}` : ""}`,
      });
      if (result.error) throw result.error;
      if (!result.redirected) navigate({ to: safeRedir });
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} sign-in failed`);
      setBusyProvider(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${safeRedirect(redirect)}`,
            data: { display_name: displayName || email.split("@")[0] },
          },
        });
        if (error) throw error;
        setInfo("Account created. Check your email to confirm, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: safeRedirect(redirect) });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const anyBusy = busy || !!busyProvider;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-ember/10 blur-[120px]" />
      </div>
      <SiteHeader />

      <main className="mx-auto flex max-w-md flex-col gap-5 px-5 py-14">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="text-center"
        >
          <span className="inline-grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-ember to-ember-glow text-background shadow-[0_8px_30px_-8px_var(--ember)]">
            <KnifeMark className="h-6 w-6" />
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "signin"
              ? "Sign in to run autopsies on your startup ideas."
              : "Free to start. No credit card required."}
          </p>
        </motion.div>

        {/* OAuth buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08, ease }}
          className="flex flex-col gap-3"
        >
          {/* Google — primary */}
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={anyBusy}
            className="relative inline-flex items-center justify-center gap-3 rounded-xl border border-border bg-surface/80 px-4 py-3 text-sm font-medium transition-all hover:border-foreground/30 hover:bg-surface disabled:opacity-50"
          >
            {busyProvider === "google" ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          {/* GitHub — secondary */}
          <button
            type="button"
            onClick={() => handleOAuth("github")}
            disabled={anyBusy}
            className="inline-flex items-center justify-center gap-3 rounded-xl border border-border bg-surface/80 px-4 py-3 text-sm font-medium transition-all hover:border-foreground/30 hover:bg-surface disabled:opacity-50"
          >
            {busyProvider === "github" ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
            ) : (
              <GitHubIcon />
            )}
            Continue with GitHub
          </button>
        </motion.div>

        {/* Divider */}
        <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>or continue with email</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Email/password form */}
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease }}
          onSubmit={handleSubmit}
          className="flex flex-col gap-3"
        >
          {mode === "signup" && (
            <input
              type="text"
              placeholder="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-ember"
            />
          )}
          <input
            type="email"
            required
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-ember"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-ember"
          />

          {error && (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-xs text-destructive">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-xl border border-border bg-surface/60 px-4 py-3 text-xs text-muted-foreground">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={anyBusy}
            className="mt-1 inline-flex items-center justify-center rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition-transform hover:scale-[1.01] disabled:opacity-50"
          >
            {busy ? "..." : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </motion.form>

        <p className="text-center text-sm text-muted-foreground">
          {mode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
              setInfo(null);
            }}
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {mode === "signin" ? "Create one" : "Sign in"}
          </button>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            ← Back home
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12Z" />
    </svg>
  );
}
