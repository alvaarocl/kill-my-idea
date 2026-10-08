import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { User, Shield, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { getMyMeta, deleteMyAccount } from "@/lib/analyses.functions";
import { getMySubscription, createPortalSession } from "@/lib/billing.functions";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [{ title: "Settings · Kill My Idea" }, { name: "robots", content: "noindex" }],
  }),
  component: SettingsPage,
});

const PLAN_BADGE: Record<string, { label: string; className: string }> = {
  free: { label: "Free", className: "bg-zinc-500/15 text-zinc-400" },
  founder: { label: "Founder", className: "bg-amber-500/15 text-amber-400" },
  pro: { label: "Pro", className: "bg-emerald-500/15 text-emerald-400" },
};

function SettingsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/auth", search: { redirect: "/settings" } });
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-5 py-16">
          <div className="h-8 w-48 animate-pulse rounded-md bg-muted" />
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16 space-y-10">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">Account</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-3 text-muted-foreground">
            Manage your account details, plan, and preferences.
          </p>
        </div>

        <AccountSection user={user} />
        <PlanSection />
        <DangerZone />
      </main>
      <SiteFooter />
    </div>
  );
}

// ─── Section 1: Mi cuenta ────────────────────────────────────────────────────

function AccountSection({ user }: { user: NonNullable<ReturnType<typeof useAuth>["user"]> }) {
  const [displayName, setDisplayName] = useState(
    (user.user_metadata?.display_name as string) ?? "",
  );
  const [newPassword, setNewPassword] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const isEmailProvider =
    user.app_metadata?.provider === "email" ||
    (user.app_metadata?.providers as string[] | undefined)?.includes("email");

  async function handleSaveName() {
    setSavingName(true);
    try {
      const { error: authErr } = await supabase.auth.updateUser({
        data: { display_name: displayName },
      });
      if (authErr) throw authErr;
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("id", user.id);
      if (profileErr) throw profileErr;
      toast.success("Display name updated");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to update name");
    } finally {
      setSavingName(false);
    }
  }

  async function handleUpdatePassword() {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated");
      setNewPassword("");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <section className="rounded-2xl border border-border/60 bg-surface/40 p-6 backdrop-blur">
      <div className="flex items-center gap-3 mb-6">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-ember/15 text-ember">
          <User className="h-4 w-4" />
        </span>
        <div className="font-display text-lg font-semibold">Mi cuenta</div>
      </div>

      <div className="space-y-5">
        {/* Display name */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
            Display name
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-ember/60 focus:ring-1 focus:ring-ember/20"
              placeholder="Your name"
            />
            <button
              onClick={handleSaveName}
              disabled={savingName}
              className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-80 disabled:opacity-50"
            >
              {savingName ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={user.email ?? ""}
            readOnly
            className="w-full rounded-lg border border-border/40 bg-muted/40 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
          />
        </div>

        {/* Change password (email provider only) */}
        {isEmailProvider && (
          <div>
            <label className="block text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
              New password
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={6}
                className="flex-1 rounded-lg border border-border/60 bg-background/60 px-3 py-2 text-sm outline-none focus:border-ember/60 focus:ring-1 focus:ring-ember/20"
                placeholder="Min 6 characters"
              />
              <button
                onClick={handleUpdatePassword}
                disabled={savingPassword || newPassword.length === 0}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:opacity-80 disabled:opacity-50"
              >
                {savingPassword ? "Updating…" : "Update password"}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Section 2: Plan actual ──────────────────────────────────────────────────

function PlanSection() {
  const fetchMeta = useServerFn(getMyMeta);
  const fetchSub = useServerFn(getMySubscription);
  const openPortal = useServerFn(createPortalSession);

  const metaQuery = useQuery({
    queryKey: ["my-meta-settings"],
    queryFn: () => fetchMeta(),
  });

  const subQuery = useQuery({
    queryKey: ["my-subscription-settings"],
    queryFn: () => fetchSub(),
  });

  const portalMutation = useMutation({
    mutationFn: () => openPortal({}),
    onSuccess: ({ url }) => window.open(url, "_blank", "noopener"),
    onError: (err: Error) => toast.error(err.message || "Could not open portal"),
  });

  const meta = metaQuery.data;
  const sub = subQuery.data;
  const badge = meta?.isAdmin
    ? { label: "Admin", className: "bg-ember/15 text-ember" }
    : (PLAN_BADGE[meta?.plan ?? "free"] ?? PLAN_BADGE.free);

  return (
    <section className="rounded-2xl border border-border/60 bg-surface/40 p-6 backdrop-blur">
      <div className="font-display text-lg font-semibold mb-4">Plan actual</div>

      {metaQuery.isLoading ? (
        <div className="h-5 w-40 animate-pulse rounded bg-muted" />
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <span
            className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium ${badge.className}`}
          >
            {badge.label}
          </span>
          {meta && (
            <span className="text-sm text-muted-foreground">
              {meta.isAdmin || meta.quota === null
                ? `${meta.used} / unlimited analyses used this month`
                : `${meta.used} / ${meta.quota} analyses used this month`}
            </span>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        {sub?.hasSubscription ? (
          <button
            onClick={() => portalMutation.mutate()}
            disabled={portalMutation.isPending}
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition disabled:opacity-50"
          >
            {portalMutation.isPending ? "Opening…" : "Manage subscription"}
          </button>
        ) : (
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background"
          >
            Upgrade →
          </Link>
        )}
      </div>
    </section>
  );
}

// ─── Section 3: Danger zone ──────────────────────────────────────────────────

function DangerZone() {
  const { user } = useAuth();
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [reAuthError, setReAuthError] = useState<string | null>(null);
  const [reAuthBusy, setReAuthBusy] = useState(false);
  const navigate = useNavigate();
  const deleteAccount = useServerFn(deleteMyAccount);

  const isEmailProvider =
    user?.app_metadata?.provider === "email" ||
    (user?.app_metadata?.providers as string[] | undefined)?.includes("email");

  const deleteMutation = useMutation({
    mutationFn: (reauthToken: string) => deleteAccount({ data: { reauthToken } }),
    onSuccess: async () => {
      await supabase.auth.signOut();
      navigate({ to: "/" });
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete account"),
  });

  function resetForm() {
    setShowConfirm(false);
    setConfirmText("");
    setPassword("");
    setReAuthError(null);
  }

  async function handleDeleteClick() {
    setReAuthError(null);
    setReAuthBusy(true);
    try {
      let reauthToken: string | undefined;

      if (isEmailProvider && user?.email) {
        // Re-authenticate with password to get a fresh, verifiable token.
        const { data: authData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: user.email,
          password,
        });
        if (signInErr || !authData.session?.access_token) {
          setReAuthError("Incorrect password. Please try again.");
          return;
        }
        reauthToken = authData.session.access_token;
      } else {
        // OAuth users: force a refresh to get a freshly-issued token (fresh iat).
        // getSession() may return a cached token issued hours ago; refreshSession() guarantees iat = now.
        const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
        if (refreshErr || !refreshData.session?.access_token) {
          setReAuthError("Could not verify your session. Please sign in again.");
          return;
        }
        reauthToken = refreshData.session.access_token;
      }

      deleteMutation.mutate(reauthToken);
    } finally {
      setReAuthBusy(false);
    }
  }

  const canDelete =
    confirmText === "DELETE" &&
    (!isEmailProvider || password.length >= 6) &&
    !deleteMutation.isPending &&
    !reAuthBusy;

  return (
    <section className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="grid h-9 w-9 place-items-center rounded-md bg-destructive/15 text-destructive">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="font-display text-lg font-semibold text-destructive">Danger zone</div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Permanently delete your account and all associated data. This action cannot be undone.
      </p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="rounded-full border border-destructive/60 px-5 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition"
        >
          Delete account
        </button>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-destructive">
            Type <span className="font-mono">DELETE</span> to confirm
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full rounded-lg border border-destructive/40 bg-background/60 px-3 py-2 text-sm outline-none focus:border-destructive focus:ring-1 focus:ring-destructive/20"
            placeholder="DELETE"
            autoComplete="off"
          />

          {/* Re-auth: email users must confirm current password */}
          {isEmailProvider && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Confirm your current password</p>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setReAuthError(null);
                }}
                className="w-full rounded-lg border border-destructive/40 bg-background/60 px-3 py-2 text-sm outline-none focus:border-destructive focus:ring-1 focus:ring-destructive/20"
                placeholder="Current password"
                autoComplete="current-password"
              />
            </div>
          )}

          {reAuthError && <p className="text-xs text-destructive">{reAuthError}</p>}

          <div className="flex gap-2">
            <button
              onClick={resetForm}
              className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={!canDelete}
              className="rounded-full bg-destructive px-4 py-2 text-sm font-medium text-white transition hover:bg-destructive/80 disabled:opacity-50"
            >
              {deleteMutation.isPending || reAuthBusy ? "Deleting…" : "Delete my account"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
