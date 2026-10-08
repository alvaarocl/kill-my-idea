import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { z } from "zod";
import { SiteHeader, KnifeMark } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getAnalysis, getMyMeta } from "@/lib/analyses.functions";

const ease = [0.22, 1, 0.36, 1] as const;

const searchSchema = z.object({
  price: z.string().optional(),
  analysis: z.string().uuid().optional(),
});

function CheckoutSuccess() {
  const search = Route.useSearch();
  const isSingleReport = search.price === "single_report_once";
  const fetchAnalysis = useServerFn(getAnalysis);
  const fetchMeta = useServerFn(getMyMeta);

  const analysisQuery = useQuery({
    queryKey: ["checkout-success", "analysis", search.analysis],
    queryFn: () => fetchAnalysis({ data: { id: search.analysis! } }),
    enabled: isSingleReport && !!search.analysis,
    retry: false,
    refetchInterval: (query) => (query.state.data?.unlocked ? false : 2000),
  });

  const metaQuery = useQuery({
    queryKey: ["checkout-success", "meta"],
    queryFn: () => fetchMeta(),
    enabled: !isSingleReport,
    retry: false,
    refetchInterval: (query) => {
      const plan = query.state.data?.plan;
      return plan === "founder" || plan === "pro" ? false : 2000;
    },
  });

  const singleUnlocked = !!analysisQuery.data?.unlocked;
  const subscriptionActive = metaQuery.data?.plan === "founder" || metaQuery.data?.plan === "pro";
  const isReady = isSingleReport ? singleUnlocked : subscriptionActive;
  const isRefreshing = analysisQuery.isFetching || metaQuery.isFetching;
  const statusText = isReady
    ? isSingleReport
      ? "Your report is unlocked."
      : "Your subscription is active."
    : isSingleReport
      ? "Your report is being unlocked. This usually takes a few seconds."
      : "Your subscription is being activated. This usually takes a few seconds.";

  const refreshStatus = () => {
    if (isSingleReport) void analysisQuery.refetch();
    else void metaQuery.refetch();
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SiteHeader />

      <section className="relative px-5 py-24">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-10 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-ember/15 blur-[140px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mx-auto max-w-xl rounded-3xl border border-ember/30 bg-surface/70 p-10 text-center backdrop-blur sm:p-12"
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-to-br from-ember to-ember-glow text-background shadow-[0_15px_40px_-15px_var(--ember)]">
            <KnifeMark className="h-6 w-6" />
          </div>

          <p className="mt-6 font-mono text-xs uppercase tracking-[0.22em] text-ember">
            {isReady ? "/ Payment confirmed" : "/ Payment received"}
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {isReady
              ? isSingleReport
                ? "Autopsy unlocked."
                : "Welcome aboard."
              : "Processing checkout."}
          </h1>
          <p className="mt-4 text-sm text-muted-foreground sm:text-base">{statusText}</p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {search.analysis ? (
              <Link
                to="/autopsy"
                search={{ id: search.analysis }}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-ember to-ember-glow px-6 py-3 text-sm font-semibold text-background shadow-[0_15px_40px_-15px_var(--ember)] transition-transform hover:scale-[1.03]"
              >
                Open the report <KnifeMark className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <Link
                to="/kill"
                search={{ demo: false }}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-ember to-ember-glow px-6 py-3 text-sm font-semibold text-background shadow-[0_15px_40px_-15px_var(--ember)] transition-transform hover:scale-[1.03]"
              >
                Kill another idea <KnifeMark className="h-3.5 w-3.5" />
              </Link>
            )}
            <button
              type="button"
              onClick={refreshStatus}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-foreground/40 disabled:opacity-60"
            >
              {isRefreshing ? "Checking..." : "Refresh status"}
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-6 py-3 text-sm font-medium text-foreground transition-colors hover:border-foreground/40"
            >
              Home
            </Link>
          </div>
        </motion.div>
      </section>
      <SiteFooter />
    </div>
  );
}

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (search) => searchSchema.parse(search),
  component: CheckoutSuccess,
});
