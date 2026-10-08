import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreditCard, ExternalLink, AlertTriangle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/lib/auth";
import { getMySubscription, createPortalSession } from "@/lib/billing.functions";
import { useEffect } from "react";

export const Route = createFileRoute("/billing")({
  head: () => ({
    meta: [{ title: "Billing · Kill My Idea" }, { name: "robots", content: "noindex" }],
  }),
  component: BillingPage,
});

const PRODUCT_LABELS: Record<string, string> = {
  founder_plan: "Founder",
  pro_plan: "Pro",
  single_report: "Single Report",
};

function BillingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fetchSub = useServerFn(getMySubscription);
  const openPortal = useServerFn(createPortalSession);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  const subQuery = useQuery({
    queryKey: ["my-subscription"],
    queryFn: () => fetchSub(),
    enabled: !!user,
  });

  const portalMutation = useMutation({
    mutationFn: () => openPortal({}),
    onSuccess: ({ url }) => window.open(url, "_blank", "noopener"),
    onError: (err: Error) => toast.error(err.message || "Could not open portal"),
  });

  const sub = subQuery.data;
  const isPastDue = sub?.status === "past_due";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">Account</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-3 text-muted-foreground">
          Manage your subscription, update payment method, view invoices and cancel anytime.
        </p>

        <div className="mt-10 rounded-2xl border border-border/60 bg-surface/40 p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-ember/15 text-ember">
              <CreditCard className="h-4 w-4" />
            </span>
            <div>
              <div className="font-display text-lg font-semibold">Current plan</div>
              <div className="text-sm text-muted-foreground">
                {subQuery.isLoading
                  ? "Loading…"
                  : sub?.hasSubscription
                    ? `${PRODUCT_LABELS[sub.productId ?? ""] ?? sub.productId} · ${sub.status}`
                    : "Free plan"}
              </div>
            </div>
          </div>

          {sub?.hasSubscription && (
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <Row label="Status" value={sub.status ?? "—"} />
              <Row
                label="Renews on"
                value={
                  sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : "—"
                }
              />
              <Row label="Cancels at period end" value={sub.cancelAtPeriodEnd ? "Yes" : "No"} />
              <Row label="Environment" value={sub.environment ?? "—"} />
            </dl>
          )}

          {isPastDue && (
            <div className="mt-5 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                Your last payment failed. Open the customer portal to update your payment method —
                Paddle will retry automatically.
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {sub?.hasSubscription ? (
              <button
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition disabled:opacity-50"
              >
                {portalMutation.isPending ? "Opening…" : "Manage subscription"}
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            ) : (
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background"
              >
                See plans
              </Link>
            )}
            <Link
              to="/refunds"
              className="inline-flex items-center rounded-full border border-border px-5 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              Refund policy
            </Link>
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            Payments processed by Paddle as Merchant of Record. You can also self-serve invoices and
            refunds at{" "}
            <a
              href="https://paddle.net"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground"
            >
              paddle.net
            </a>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 px-3 py-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="font-mono text-xs text-foreground">{value}</span>
    </div>
  );
}
