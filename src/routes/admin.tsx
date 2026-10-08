import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Activity,
  DollarSign,
  Users,
  CreditCard,
  TrendingUp,
  Cpu,
  Settings,
  Search,
  ChevronLeft,
  ChevronRight,
  Unlock,
  Lock,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import {
  getAdminStats,
  getAdminPaymentData,
  listAllUsers,
  listAllAnalyses,
  setUserRole,
  type AdminPaymentSummary,
  type AdminUser,
  type AdminAnalysis,
} from "@/lib/admin.functions";
import { getLegalName, setLegalName } from "@/lib/settings.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [{ title: "Admin · Kill My Idea" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminDashboard,
});

function formatUsd(n: number) {
  return `$${n.toFixed(2)}`;
}
function formatCents(c: number) {
  return `€${(c / 100).toFixed(2)}`;
}

function AdminDashboard() {
  const { user, loading } = useAuth();
  const fetchStats = useServerFn(getAdminStats);
  const fetchLegalName = useServerFn(getLegalName);
  const saveLegalName = useServerFn(setLegalName);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: () => fetchStats(),
    enabled: !!user,
  });

  const legalNameQuery = useQuery({
    queryKey: ["site-settings", "legal_name"],
    queryFn: () => fetchLegalName(),
    enabled: !!user,
  });

  const [legalNameInput, setLegalNameInput] = useState("");
  useEffect(() => {
    if (legalNameQuery.data?.legalName) setLegalNameInput(legalNameQuery.data.legalName);
  }, [legalNameQuery.data?.legalName]);

  const legalNameMutation = useMutation({
    mutationFn: (legalName: string) => saveLegalName({ data: { legalName } }),
    onSuccess: (res) => {
      toast.success("Legal name updated");
      queryClient.setQueryData(["site-settings", "legal_name"], res);
    },
    onError: (err: Error) => toast.error(err.message === "Forbidden" ? "Admin only" : err.message),
  });

  if (loading || (!user && !loading)) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-5 py-20 text-center">
          {loading ? (
            <p className="text-muted-foreground">Loading…</p>
          ) : (
            <>
              <h1 className="font-display text-3xl font-semibold">Admin only</h1>
              <p className="mt-2 text-muted-foreground">You need to sign in as an admin.</p>
              <Link
                to="/"
                className="mt-6 inline-flex items-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background"
              >
                Go home
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[400px] bg-gradient-to-b from-ember/10 via-transparent to-transparent" />

        <div className="mx-auto max-w-6xl px-5 py-12">
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">
              Internal · Admin
            </p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight md:text-5xl">
              Cost & revenue dashboard
            </h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Real AI cost per autopsy, revenue across plans, and top users by activity. Estimated
              cost assumes Gemini 3 Flash at ~$0.05 / report.
            </p>
          </motion.div>

          {error && (
            <div className="mt-8 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
              {(error as Error).message === "Forbidden"
                ? "You don't have admin access."
                : (error as Error).message}
            </div>
          )}

          {isLoading && !data && <div className="mt-10 text-muted-foreground">Loading stats…</div>}

          {data && (
            <>
              <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard
                  icon={<Users className="h-4 w-4" />}
                  label="Users"
                  value={data.totals.users.toString()}
                />
                <StatCard
                  icon={<Activity className="h-4 w-4" />}
                  label="Autopsies run"
                  value={data.totals.analyses.toString()}
                />
                <StatCard
                  icon={<Cpu className="h-4 w-4" />}
                  label="AI cost (estimated)"
                  value={formatUsd(data.totals.aiCostUsd)}
                  sub={`@ ~$0.05 per report`}
                />
                <StatCard
                  icon={<DollarSign className="h-4 w-4" />}
                  label="One-time revenue"
                  value={formatCents(data.totals.oneTimeRevenueCents)}
                />
                <StatCard
                  icon={<CreditCard className="h-4 w-4" />}
                  label="Active subscriptions"
                  value={data.totals.activeSubscriptions.toString()}
                />
                <StatCard
                  icon={<TrendingUp className="h-4 w-4" />}
                  label="MRR"
                  value={formatCents(data.totals.mrrCents)}
                />
              </div>

              <section className="mt-12">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-ember" />
                  <h2 className="font-display text-2xl font-semibold">Site settings</h2>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  Editing your legal name updates Terms, Privacy and Refunds automatically.
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = legalNameInput.trim();
                    if (!v) return;
                    legalNameMutation.mutate(v);
                  }}
                  className="mt-5 max-w-xl rounded-xl border border-border/60 bg-surface/40 p-5 backdrop-blur"
                >
                  <Label
                    htmlFor="legal-name"
                    className="text-xs uppercase tracking-wider text-muted-foreground"
                  >
                    Legal name (autónomo or company)
                  </Label>
                  <Input
                    id="legal-name"
                    value={legalNameInput}
                    onChange={(e) => setLegalNameInput(e.target.value)}
                    placeholder="e.g. Juan Pérez García or Acme Labs SL"
                    className="mt-2"
                    disabled={legalNameQuery.isLoading}
                  />
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Current:{" "}
                      <span className="font-mono text-foreground">
                        {legalNameQuery.data?.legalName ?? "…"}
                      </span>
                    </p>
                    <button
                      type="submit"
                      disabled={
                        legalNameMutation.isPending ||
                        legalNameInput.trim() === (legalNameQuery.data?.legalName ?? "")
                      }
                      className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background transition disabled:opacity-50"
                    >
                      {legalNameMutation.isPending ? "Saving…" : "Save"}
                    </button>
                  </div>
                </form>
              </section>

              <section className="mt-12">
                <h2 className="font-display text-2xl font-semibold">Top users</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Highest activity by autopsies generated.
                </p>

                <div className="mt-5 overflow-hidden rounded-xl border border-border/60 bg-surface/40 backdrop-blur">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border/60 bg-background/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">User</th>
                          <th className="px-4 py-3 font-medium">Plan</th>
                          <th className="px-4 py-3 text-right font-medium">Autopsies</th>
                          <th className="px-4 py-3 text-right font-medium">AI cost</th>
                          <th className="px-4 py-3 text-right font-medium">Revenue</th>
                          <th className="px-4 py-3 text-right font-medium">Margin</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.topUsers.length === 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-10 text-center text-muted-foreground"
                            >
                              No activity yet.
                            </td>
                          </tr>
                        )}
                        {data.topUsers.map((u) => {
                          const revenueUsd = u.revenueCents / 100;
                          const margin = revenueUsd - u.aiCostUsd;
                          return (
                            <tr key={u.userId} className="border-b border-border/40 last:border-0">
                              <td className="px-4 py-3">
                                <div className="font-medium text-foreground">
                                  {u.displayName ?? "Anonymous"}
                                </div>
                                <div className="font-mono text-[10px] text-muted-foreground">
                                  {u.userId.slice(0, 8)}…
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                                  {u.plan}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-mono">{u.analyses}</td>
                              <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                                {formatUsd(u.aiCostUsd)}
                              </td>
                              <td className="px-4 py-3 text-right font-mono">
                                €{(u.revenueCents / 100).toFixed(2)}
                              </td>
                              <td
                                className={`px-4 py-3 text-right font-mono ${
                                  margin >= 0 ? "text-emerald-400" : "text-destructive"
                                }`}
                              >
                                {margin >= 0 ? "+" : ""}
                                {margin.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <section className="mt-12">
                <h2 className="font-display text-2xl font-semibold">Recent autopsies</h2>
                <div className="mt-5 space-y-2">
                  {data.recentAnalyses.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between gap-4 rounded-lg border border-border/50 bg-surface/30 px-4 py-3 text-sm"
                    >
                      <div className="min-w-0 flex-1 truncate">{a.idea}</div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {new Date(a.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                  {data.recentAnalyses.length === 0 && (
                    <p className="text-sm text-muted-foreground">No autopsies yet.</p>
                  )}
                </div>
              </section>

              <AllUsersSection currentUserId={user?.id ?? ""} />
              <PaymentsSection />
              <AllAnalysesSection />
            </>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="relative overflow-hidden rounded-xl border border-border/60 bg-surface/40 p-5 backdrop-blur"
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <span className="grid h-6 w-6 place-items-center rounded-md bg-ember/15 text-ember">
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-3 font-display text-3xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </motion.div>
  );
}

// ─── PlanBadge ────────────────────────────────────────────────────────────────

function PaymentsSection() {
  const fetchPayments = useServerFn(getAdminPaymentData);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: () => fetchPayments(),
  });
  const payments: AdminPaymentSummary | undefined = data;

  return (
    <section className="mt-12">
      <div className="flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-ember" />
        <h2 className="font-display text-2xl font-semibold">Payments</h2>
        {payments && (
          <span className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {payments.environment}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Recent one-time purchases, subscriptions, and processed Paddle webhook events.
      </p>
      {isLoading && <div className="mt-4 text-sm text-muted-foreground">Loading payments...</div>}
      {error && (
        <div className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {(error as Error).message}
        </div>
      )}
      {payments && (
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <PaymentPanel title="One-time purchases" empty="No purchases yet.">
            {payments.recentPurchases.map((p) => (
              <PaymentRow
                key={p.id}
                title={`${formatCents(p.amountCents)} ${p.currency.toUpperCase()}`}
                meta={p.priceId}
                sub={`${p.email ?? p.userId.slice(0, 8)} / ${new Date(p.createdAt).toLocaleString()}`}
              />
            ))}
          </PaymentPanel>
          <PaymentPanel title="Subscriptions" empty="No subscriptions yet.">
            {payments.recentSubscriptions.map((s) => (
              <PaymentRow
                key={s.id}
                title={`${s.productId} / ${s.status}`}
                meta={s.cancelAtPeriodEnd ? "canceling" : "active"}
                sub={`${s.email ?? s.userId.slice(0, 8)} / ${new Date(s.createdAt).toLocaleString()}`}
              />
            ))}
          </PaymentPanel>
          <PaymentPanel title="Webhook events" empty="No events processed yet.">
            {payments.recentEvents.map((e) => (
              <PaymentRow
                key={e.eventId}
                title={e.eventType}
                meta={e.environment}
                sub={`${e.eventId.slice(0, 12)}... / ${new Date(e.processedAt).toLocaleString()}`}
              />
            ))}
          </PaymentPanel>
        </div>
      )}
    </section>
  );
}

function PaymentPanel({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-surface/40 backdrop-blur">
      <div className="border-b border-border/60 bg-background/40 px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="divide-y divide-border/40">
        {items.length ? (
          items
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">{empty}</div>
        )}
      </div>
    </div>
  );
}

function PaymentRow({ title, meta, sub }: { title: string; meta: string; sub: string }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground">{title}</div>
          <div className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{sub}</div>
        </div>
        <span className="shrink-0 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {meta}
        </span>
      </div>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const cls =
    plan === "founder"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
      : plan === "pro"
        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
        : "border-border/60 bg-background/60 text-muted-foreground";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${cls}`}
    >
      {plan}
    </span>
  );
}

// ─── VerdictPill ──────────────────────────────────────────────────────────────

function VerdictPill({ verdict }: { verdict: string | null }) {
  if (!verdict) return <span className="text-xs text-muted-foreground">—</span>;
  const cls =
    verdict === "ship"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
      : verdict === "pivot"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
        : verdict === "kill"
          ? "border-destructive/40 bg-destructive/10 text-destructive"
          : "border-border/60 bg-background/60 text-muted-foreground";
  return (
    <span
      className={`rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${cls}`}
    >
      {verdict}
    </span>
  );
}

// ─── PaginationBar ────────────────────────────────────────────────────────────

function PaginationBar({
  page,
  total,
  pageSize,
  onPrev,
  onNext,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);
  return (
    <div className="flex items-center justify-between px-4 py-3 text-xs text-muted-foreground">
      <span>{total === 0 ? "0 results" : `${start}–${end} of ${total}`}</span>
      <div className="flex gap-1">
        <button
          onClick={onPrev}
          disabled={page === 0}
          className="rounded-md border border-border/60 p-1 transition hover:bg-surface/60 disabled:opacity-30"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onNext}
          disabled={end >= total}
          className="rounded-md border border-border/60 p-1 transition hover:bg-surface/60 disabled:opacity-30"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── AllUsersSection ──────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

function AllUsersSection({ currentUserId }: { currentUserId: string }) {
  const fetchUsers = useServerFn(listAllUsers);
  const changeRole = useServerFn(setUserRole);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(0);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", debouncedSearch, page],
    queryFn: () => fetchUsers({ data: { search: debouncedSearch || undefined, page } }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) =>
      changeRole({ data: { userId, makeAdmin } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const users: AdminUser[] = data?.users ?? [];
  const total = data?.total ?? 0;

  return (
    <section className="mt-12">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-ember" />
        <h2 className="font-display text-2xl font-semibold">All users</h2>
        {total > 0 && (
          <span className="ml-1 rounded-full bg-ember/10 px-2 py-0.5 font-mono text-xs text-ember">
            {total}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border/60 bg-surface/40 py-2 pl-8 pr-3 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ember/40"
          />
        </div>
        {isLoading && <span className="text-xs text-muted-foreground">Loading…</span>}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-surface/40 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-background/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 text-right font-medium">Analyses</th>
                <th className="px-4 py-3 text-right font-medium">Revenue</th>
                <th className="px-4 py-3 text-right font-medium">Joined</th>
                <th className="px-4 py-3 text-center font-medium">Admin</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No users yet.
                  </td>
                </tr>
              )}
              {users.map((u) => {
                const isSelf = u.userId === currentUserId;
                const isPending =
                  roleMutation.isPending && roleMutation.variables?.userId === u.userId;
                return (
                  <tr
                    key={u.userId}
                    className="border-b border-border/40 last:border-0 hover:bg-surface/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {u.displayName ?? "Anonymous"}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {u.email ?? u.userId.slice(0, 8) + "…"}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <PlanBadge plan={u.plan} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{u.analyses}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {u.revenueCents > 0 ? `€${(u.revenueCents / 100).toFixed(2)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        disabled={isSelf || isPending}
                        title={
                          isSelf
                            ? "Cannot change your own role"
                            : u.isAdmin
                              ? "Remove admin"
                              : "Make admin"
                        }
                        onClick={() =>
                          roleMutation.mutate({ userId: u.userId, makeAdmin: !u.isAdmin })
                        }
                        className={`inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 font-mono text-[10px] transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          u.isAdmin
                            ? "border-ember/40 bg-ember/10 text-ember hover:bg-ember/20"
                            : "border-border/60 bg-surface/40 text-muted-foreground hover:border-foreground/40"
                        }`}
                      >
                        {isPending ? "…" : u.isAdmin ? "admin" : "—"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <PaginationBar
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>
    </section>
  );
}

// ─── AllAnalysesSection ───────────────────────────────────────────────────────

function AllAnalysesSection() {
  const fetchAnalyses = useServerFn(listAllAnalyses);
  const [verdict, setVerdict] = useState<"all" | "ship" | "pivot" | "kill">("all");
  const [unlocked, setUnlocked] = useState<"all" | "true" | "false">("all");
  const [page, setPage] = useState(0);

  // Reset page when filters change
  const handleVerdictChange = useCallback((v: typeof verdict) => {
    setVerdict(v);
    setPage(0);
  }, []);
  const handleUnlockedChange = useCallback((v: typeof unlocked) => {
    setUnlocked(v);
    setPage(0);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-analyses", verdict, unlocked, page],
    queryFn: () => fetchAnalyses({ data: { verdict, unlocked, page } }),
  });

  const analyses: AdminAnalysis[] = data?.analyses ?? [];
  const total = data?.total ?? 0;

  return (
    <section className="mt-12 mb-16">
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-ember" />
        <h2 className="font-display text-2xl font-semibold">All analyses</h2>
        {total > 0 && (
          <span className="ml-1 rounded-full bg-ember/10 px-2 py-0.5 font-mono text-xs text-ember">
            {total}
          </span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {/* Verdict filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Verdict</span>
          <div className="flex rounded-lg border border-border/60 bg-surface/40 overflow-hidden text-xs">
            {(["all", "ship", "pivot", "kill"] as const).map((v) => (
              <button
                key={v}
                onClick={() => handleVerdictChange(v)}
                className={`px-3 py-1.5 capitalize transition ${
                  verdict === v
                    ? "bg-ember/20 text-ember font-medium"
                    : "text-muted-foreground hover:bg-surface/60"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Unlocked filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Status</span>
          <div className="flex rounded-lg border border-border/60 bg-surface/40 overflow-hidden text-xs">
            {(
              [
                { value: "all", label: "All" },
                { value: "true", label: "Unlocked" },
                { value: "false", label: "Locked" },
              ] as const
            ).map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleUnlockedChange(value)}
                className={`px-3 py-1.5 transition ${
                  unlocked === value
                    ? "bg-ember/20 text-ember font-medium"
                    : "text-muted-foreground hover:bg-surface/60"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {isLoading && <span className="text-xs text-muted-foreground">Loading…</span>}
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-border/60 bg-surface/40 backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 bg-background/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Idea</th>
                <th className="px-4 py-3 font-medium">Verdict</th>
                <th className="px-4 py-3 text-right font-medium">Score</th>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {analyses.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No analyses yet.
                  </td>
                </tr>
              )}
              {analyses.map((a) => (
                <tr
                  key={a.id}
                  className="border-b border-border/40 last:border-0 hover:bg-surface/60 transition-colors"
                >
                  <td className="px-4 py-3 max-w-[280px]">
                    <button
                      className="text-left hover:text-ember transition-colors"
                      onClick={() => {
                        navigator.clipboard.writeText(a.idea).catch(() => null);
                      }}
                      title="Click to copy full idea"
                    >
                      <span className="line-clamp-2 text-sm">
                        {a.idea.length > 60 ? `${a.idea.slice(0, 60)}…` : a.idea}
                      </span>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <VerdictPill verdict={a.verdict} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {a.score != null ? `${a.score}/10` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-foreground">{a.displayName ?? "Anonymous"}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {a.userId.slice(0, 8)}…
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {a.unlocked ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                        <Unlock className="h-2.5 w-2.5" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                        <Lock className="h-2.5 w-2.5" />
                        Locked
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PaginationBar
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
          onPrev={() => setPage((p) => Math.max(0, p - 1))}
          onNext={() => setPage((p) => p + 1)}
        />
      </div>
    </section>
  );
}
