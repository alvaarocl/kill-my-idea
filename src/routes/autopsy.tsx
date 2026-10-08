import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { User } from "@supabase/supabase-js";
import type { KillResult } from "@/lib/analyze.functions";
import { loadResult, type StoredResult } from "@/lib/result-store";
import { SiteHeader, KnifeMark } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLang, type TKey } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAnalysis } from "@/lib/analyses.functions";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import {
  formatAsMarkdown,
  formatAsAIBriefing,
  formatAsJSON,
  formatAsShortSummary,
  downloadFile,
  slugify,
} from "@/lib/report-export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, FileJson, FileText, Bot, MessageSquareQuote, Download } from "lucide-react";

export const Route = createFileRoute("/autopsy")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Autopsy report — Kill My Idea" },
      {
        name: "description",
        content:
          "Your startup idea autopsy: verdict, 12-metric scoring, deep market research, competitors, dead clones, business model, tech stack, MVP prompt and roadmap.",
      },
      { property: "og:title", content: "Autopsy report — Kill My Idea" },
      {
        property: "og:description",
        content:
          "Verdict, scores, named competitors, TAM, big-tech threats, business model, tech stack, MVP prompt and roadmap.",
      },
    ],
  }),
  component: AutopsyPage,
});

const METRIC_KEYS: Record<keyof KillResult["scores"], TKey> = {
  market_size: "metric.market_size",
  competition: "metric.competition",
  execution: "metric.execution",
  timing: "metric.timing",
  originality: "metric.originality",
  moat: "metric.moat",
  demand: "metric.demand",
  monetization: "metric.monetization",
  scalability: "metric.scalability",
  regulatory: "metric.regulatory",
  virality: "metric.virality",
  founder_fit: "metric.founder_fit",
};

const ease = [0.22, 1, 0.36, 1] as const;

function AutopsyPage() {
  const navigate = useNavigate();
  const { id } = Route.useSearch();
  const { user, loading: authLoading } = useAuth();
  const [stored, setStored] = useState<StoredResult | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const getAnalysisFn = useServerFn(getAnalysis);

  const dbQuery = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => getAnalysisFn({ data: { id: id! } }),
    enabled: !!id && !!user && !authLoading,
  });

  useEffect(() => {
    if (id && authLoading) return;

    if (id && user) {
      const fallback = loadResult();
      if (!stored && fallback?.analysisId === id) {
        setStored(fallback);
        setHydrated(true);
      }
      // Loading from DB — hydrated once query settles
      if (dbQuery.data) {
        const detail = dbQuery.data;
        setStored({
          idea: detail.idea,
          result: detail.result,
          at: new Date(detail.created_at).getTime(),
          locked: !detail.unlocked,
          analysisId: detail.id,
          mode: "personal",
        });
        setHydrated(true);
      } else if (dbQuery.isError) {
        if (fallback?.analysisId === id) {
          setStored(fallback);
          setHydrated(true);
        } else {
          navigate({ to: "/kill", search: { demo: false } });
        }
      }
      return;
    }

    if (id && !user) {
      navigate({ to: "/auth", search: { redirect: `/autopsy?id=${id}` } });
      return;
    }

    const data = loadResult();
    if (!data) {
      navigate({ to: "/kill", search: { demo: false } });
      return;
    }
    setStored(data);
    setHydrated(true);
  }, [id, user, authLoading, stored, dbQuery.data, dbQuery.isError, navigate]);

  if (!hydrated || !stored) {
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <div className="grid place-items-center py-32 text-sm text-muted-foreground">…</div>
      </div>
    );
  }

  const locked = stored.locked ?? false;

  return <Report stored={stored} locked={locked} user={user} />;
}

function Report({
  stored,
  locked,
  user,
}: {
  stored: StoredResult;
  locked?: boolean;
  user?: User | null;
}) {
  const { t } = useLang();
  const { result, idea } = stored;
  const scores = Object.values(result.scores);
  const overall = scores.reduce((a, b) => a + b, 0) / scores.length;
  const [promptCopied, setPromptCopied] = useState(false);

  const verdict = result.verdict;
  const verdictMeta = {
    ship: {
      emoji: "🚀",
      labelKey: "verdict.ship.label" as TKey,
      tagKey: "verdict.ship.tag" as TKey,
      tone: "good" as const,
    },
    pivot: {
      emoji: "⚠️",
      labelKey: "verdict.pivot.label" as TKey,
      tagKey: "verdict.pivot.tag" as TKey,
      tone: "warn" as const,
    },
    kill: {
      emoji: "☠️",
      labelKey: "verdict.kill.label" as TKey,
      tagKey: "verdict.kill.tag" as TKey,
      tone: "ember" as const,
    },
  }[verdict];

  const toneClass = {
    good: { text: "text-good", bg: "bg-good/10", border: "border-good/40" },
    warn: { text: "text-warn", bg: "bg-warn/10", border: "border-warn/40" },
    ember: { text: "text-ember", bg: "bg-ember/10", border: "border-ember/40" },
  }[verdictMeta.tone];

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(result.mvp_prompt);
      setPromptCopied(true);
      setTimeout(() => setPromptCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SiteHeader />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[480px] w-[820px] -translate-x-1/2 rounded-full bg-ember/10 blur-[140px]" />
      </div>

      <div className="mx-auto max-w-6xl px-5 pb-32 pt-12 sm:pt-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="flex flex-col items-start justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-end"
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember">
                / {t("autopsy.eyebrow")}
              </p>
              <span className="rounded-full border border-border bg-surface/60 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {result.category}
              </span>
            </div>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("autopsy.title")}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {result.one_liner}
            </p>
          </div>
          <div className="flex gap-2">
            <ShareMenu idea={idea} result={result} variant="ghost" locked={locked} />
            <Link
              to="/kill"
              search={{ demo: false }}
              className="rounded-full border border-border bg-surface/60 px-4 py-2 text-xs font-medium backdrop-blur transition-colors hover:border-foreground/40"
            >
              {t("autopsy.newIdea")}
            </Link>
          </div>
        </motion.div>

        {/* Submitted idea */}
        <Reveal delay={0.05}>
          <div className="mt-8 rounded-2xl border border-border bg-surface/50 p-5">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("autopsy.submitted")}
            </p>
            <p className="mt-2 leading-relaxed text-foreground/90">{idea}</p>
          </div>
        </Reveal>

        {/* Verdict + Overall + Roast */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-6">
          <Reveal delay={0.1} className="sm:col-span-4">
            <Card accent>
              <Eyebrow accent>{t("autopsy.roast")}</Eyebrow>
              <p className="mt-4 font-display text-2xl font-medium leading-snug sm:text-3xl">
                <span className="text-ember">"</span>
                {result.roast}
                <span className="text-ember">"</span>
              </p>
            </Card>
          </Reveal>

          <Reveal delay={0.15} className="sm:col-span-2">
            <Card>
              <Eyebrow>{t("autopsy.verdict")}</Eyebrow>
              <div
                className={`mt-4 rounded-2xl border-2 ${toneClass.border} ${toneClass.bg} p-5 text-center`}
              >
                <p className="text-4xl">{verdictMeta.emoji}</p>
                <p
                  className={`mt-2 font-display text-2xl font-bold tracking-tight ${toneClass.text}`}
                >
                  {t(verdictMeta.labelKey)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{t(verdictMeta.tagKey)}</p>
              </div>
            </Card>
          </Reveal>

          <Reveal delay={0.18} className="sm:col-span-2">
            <Card>
              <Eyebrow>{t("autopsy.overall")}</Eyebrow>
              <div className="mt-3 flex items-baseline gap-2">
                <span
                  className={`font-display text-7xl font-semibold leading-none ${overall >= 7 ? "text-good" : overall >= 4 ? "text-warn" : "text-ember"}`}
                >
                  {overall.toFixed(1)}
                </span>
                <span className="font-mono text-xl text-muted-foreground">/10</span>
              </div>
              <ScoreRing value={overall} />
            </Card>
          </Reveal>

          <Reveal delay={0.2} className="sm:col-span-4">
            <Card>
              <Eyebrow>{t("autopsy.verdict.summary")}</Eyebrow>
              <p className="mt-4 leading-relaxed text-foreground/90">{result.verdict_summary}</p>
              <div className="mt-5 rounded-xl border border-ember/30 bg-background/40 p-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ember">
                  {t("autopsy.quote")}
                </p>
                <p className="mt-2 font-display text-lg italic leading-snug">"{result.quote}"</p>
              </div>
            </Card>
          </Reveal>

          {/* Locked sections start here — scores + everything below */}
          <LockedSection
            locked={locked}
            analysisId={stored.analysisId}
            userEmail={user?.email ?? undefined}
          >
            {/* Scores grid */}
            <Reveal delay={0.25} className="sm:col-span-6">
              <Card>
                <Eyebrow>{t("autopsy.scores")}</Eyebrow>
                <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {(Object.keys(METRIC_KEYS) as Array<keyof KillResult["scores"]>).map((k, i) => (
                    <ScoreBar
                      key={k}
                      label={t(METRIC_KEYS[k])}
                      score={result.scores[k]}
                      delay={0.03 * i}
                    />
                  ))}
                </ul>
              </Card>
            </Reveal>

            {/* Market research */}
            <Reveal delay={0.3} className="sm:col-span-6">
              <Card>
                <Eyebrow>{t("autopsy.market")}</Eyebrow>
                <div className="mt-5 grid gap-5 sm:grid-cols-3">
                  <Stat label={t("autopsy.market.tam")} value={result.market.tam} />
                  <Stat label={t("autopsy.market.sam")} value={result.market.sam} />
                  <Stat label={t("autopsy.market.som")} value={result.market.som} />
                  <Stat label={t("autopsy.market.growth")} value={result.market.growth} />
                  <Stat label={t("autopsy.market.maturity")} value={result.market.maturity} />
                  <Stat
                    label={t("autopsy.market.customer")}
                    value={result.market.target_customer}
                  />
                </div>

                <div className="mt-7 grid gap-6 border-t border-border pt-5 sm:grid-cols-2">
                  <div>
                    <SubEyebrow>{t("autopsy.market.geographies")}</SubEyebrow>
                    <ul className="mt-3 space-y-2 text-sm">
                      {result.market.geographies.map((g, i) => (
                        <li key={i} className="flex gap-3 leading-relaxed">
                          <span className="font-mono text-ember">0{i + 1}</span>
                          <span>{g}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <SubEyebrow>{t("autopsy.market.trends")}</SubEyebrow>
                    <ul className="mt-3 space-y-2 text-sm">
                      {result.market.trends.map((tr, i) => (
                        <li key={i} className="flex gap-3 leading-relaxed">
                          <span className="font-mono text-ember">↗</span>
                          <span>{tr}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-7 border-t border-border pt-5">
                  <SubEyebrow ember>{t("autopsy.market.redflags")}</SubEyebrow>
                  <ul className="mt-3 space-y-2">
                    {result.market.red_flags.map((f, i) => (
                      <li key={i} className="flex gap-3 text-sm leading-relaxed">
                        <span className="font-mono text-ember">·</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            </Reveal>

            {/* Personas */}
            <Reveal delay={0.32} className="sm:col-span-6">
              <Card>
                <Eyebrow>{t("autopsy.personas")}</Eyebrow>
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {result.personas.map((p, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.05 * i, ease }}
                      className="rounded-2xl border border-border bg-background/40 p-5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-ember/15 font-mono text-xs text-ember">
                          {i + 1}
                        </span>
                        <p className="font-display text-base font-semibold tracking-tight">
                          {p.name}
                        </p>
                      </div>
                      <p className="mt-3 text-xs text-muted-foreground">{p.who}</p>
                      <KV label={t("autopsy.persona.pain")} value={p.pain} />
                      <KV label={t("autopsy.persona.wtp")} value={p.willingness_to_pay} />
                      <KV label={t("autopsy.persona.find")} value={p.where_to_find} />
                    </motion.div>
                  ))}
                </div>
              </Card>
            </Reveal>

            {/* Competitor map */}
            <Reveal delay={0.34} className="sm:col-span-6">
              <Card>
                <Eyebrow>{t("autopsy.competitors")}</Eyebrow>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {result.competitors.map((c, i) => (
                    <motion.li
                      key={c.name + i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.04 * i, ease }}
                      className="rounded-xl border border-border bg-background/40 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-base font-semibold tracking-tight">
                            {c.name}
                          </p>
                          <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                            {c.type} · {c.funding}
                          </p>
                        </div>
                        <ThreatPill
                          level={c.threat_level}
                          label={t("autopsy.competitors.threat")}
                        />
                      </div>
                      <div className="mt-3 grid gap-2 text-xs leading-relaxed sm:grid-cols-2">
                        <div>
                          <span className="text-good">+ </span>
                          <span className="text-foreground/80">{c.strength}</span>
                        </div>
                        <div>
                          <span className="text-ember">− </span>
                          <span className="text-foreground/80">{c.weakness}</span>
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              </Card>
            </Reveal>

            {/* Big tech threats + Dead clones */}
            <Reveal delay={0.36} className="sm:col-span-3">
              <Card>
                <Eyebrow>{t("autopsy.bigtech")}</Eyebrow>
                <ul className="mt-5 space-y-3">
                  {result.bigtech_threats.map((b, i) => (
                    <li key={i} className="rounded-xl border border-border bg-background/40 p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-display text-base font-semibold tracking-tight">
                          {b.company}
                        </p>
                        <LikelihoodPill level={b.likelihood} />
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-foreground/80">{b.reason}</p>
                      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                        {t("autopsy.bigtech.timeline")}: {b.timeline}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>

            <Reveal delay={0.38} className="sm:col-span-3">
              <Card>
                <Eyebrow>{t("autopsy.dead")}</Eyebrow>
                <ul className="mt-5 space-y-3">
                  {result.similar_dead.map((d, i) => (
                    <li key={i} className="rounded-xl border border-border bg-background/40 p-4">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-display text-base font-semibold tracking-tight">
                          ☠ {d.name}
                        </p>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {d.died}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{d.what}</p>
                      <p className="mt-2 text-xs leading-relaxed text-foreground/80">
                        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ember">
                          {t("autopsy.dead.cause")}:
                        </span>{" "}
                        {d.cause}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>

            {/* Business model */}
            <Reveal delay={0.4} className="sm:col-span-6">
              <Card>
                <Eyebrow>{t("autopsy.model")}</Eyebrow>
                <div className="mt-5 grid gap-6 lg:grid-cols-3">
                  <div>
                    <SubEyebrow>{t("autopsy.model.revenue")}</SubEyebrow>
                    <ul className="mt-3 space-y-2 text-sm">
                      {result.business_model.revenue_streams.map((r, i) => (
                        <li key={i} className="flex gap-3 leading-relaxed">
                          <span className="font-mono text-ember">0{i + 1}</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="lg:col-span-2">
                    <SubEyebrow>{t("autopsy.model.pricing")}</SubEyebrow>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {result.business_model.pricing_tiers.map((p, i) => (
                        <div
                          key={i}
                          className={`rounded-xl border p-4 ${i === 1 ? "border-ember/40 bg-ember/5" : "border-border bg-background/40"}`}
                        >
                          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                            {p.name}
                          </p>
                          <p className="mt-2 font-display text-2xl font-semibold tracking-tight">
                            {p.price}
                          </p>
                          <p className="mt-2 text-xs leading-relaxed text-foreground/80">
                            {p.includes}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-7 border-t border-border pt-5">
                  <SubEyebrow>{t("autopsy.model.unit")}</SubEyebrow>
                  <div className="mt-3 grid gap-4 sm:grid-cols-4">
                    <Stat
                      label={t("autopsy.model.cac")}
                      value={result.business_model.unit_economics.cac_estimate}
                    />
                    <Stat
                      label={t("autopsy.model.ltv")}
                      value={result.business_model.unit_economics.ltv_estimate}
                    />
                    <Stat
                      label={t("autopsy.model.margin")}
                      value={result.business_model.unit_economics.gross_margin}
                    />
                    <Stat
                      label={t("autopsy.model.payback")}
                      value={result.business_model.unit_economics.payback_period}
                    />
                  </div>
                </div>
              </Card>
            </Reveal>

            {/* GTM */}
            <Reveal delay={0.42} className="sm:col-span-6">
              <Card>
                <Eyebrow>{t("autopsy.gtm")}</Eyebrow>
                <div className="mt-5 rounded-xl border border-ember/30 bg-background/40 p-5">
                  <SubEyebrow ember>{t("autopsy.gtm.wedge")}</SubEyebrow>
                  <p className="mt-2 font-display text-xl font-medium leading-snug">
                    {result.gtm.wedge}
                  </p>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <SubEyebrow>{t("autopsy.gtm.channels")}</SubEyebrow>
                    <ul className="mt-3 space-y-2">
                      {result.gtm.channels.map((c, i) => (
                        <li
                          key={i}
                          className="flex items-start justify-between gap-3 rounded-xl border border-border bg-background/40 p-3"
                        >
                          <div>
                            <p className="font-display text-base font-semibold tracking-tight">
                              {c.name}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {c.why}
                            </p>
                          </div>
                          <EffortPill level={c.effort} label={t("autopsy.effort")} />
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <SubEyebrow>{t("autopsy.gtm.first100")}</SubEyebrow>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                      {result.gtm.first_100_users}
                    </p>

                    <div className="mt-5">
                      <SubEyebrow>{t("autopsy.gtm.content")}</SubEyebrow>
                      <ul className="mt-3 space-y-2 text-xs">
                        {result.gtm.content_angles.map((a, i) => (
                          <li key={i} className="flex gap-2 leading-relaxed">
                            <span className="font-mono text-ember">→</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            </Reveal>

            {/* Tech stack */}
            <Reveal delay={0.44} className="sm:col-span-3">
              <Card>
                <Eyebrow>{t("autopsy.stack")}</Eyebrow>
                <dl className="mt-5 space-y-3 text-sm">
                  <StackRow
                    label={t("autopsy.stack.frontend")}
                    value={result.tech_stack.frontend}
                  />
                  <StackRow label={t("autopsy.stack.backend")} value={result.tech_stack.backend} />
                  <StackRow label={t("autopsy.stack.db")} value={result.tech_stack.database} />
                  <StackRow label={t("autopsy.stack.ai")} value={result.tech_stack.ai} />
                  <StackRow label={t("autopsy.stack.infra")} value={result.tech_stack.infra} />
                  <StackRow
                    label={t("autopsy.stack.integrations")}
                    value={result.tech_stack.integrations.join(" · ")}
                  />
                  <StackRow
                    label={t("autopsy.stack.build")}
                    value={result.tech_stack.build_time}
                    ember
                  />
                </dl>
                <p className="mt-4 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
                  {result.tech_stack.rationale}
                </p>
              </Card>
            </Reveal>

            {/* MVP prompt */}
            <Reveal delay={0.46} className="sm:col-span-3">
              <Card accent>
                <div className="flex items-start justify-between gap-3">
                  <Eyebrow accent>{t("autopsy.prompt")}</Eyebrow>
                  <button
                    onClick={copyPrompt}
                    className="rounded-full border border-ember/40 bg-ember/10 px-3 py-1 text-[10px] font-medium text-ember transition-colors hover:bg-ember/20"
                  >
                    {promptCopied ? t("autopsy.prompt.copied") : t("autopsy.prompt.copy")}
                  </button>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{t("autopsy.prompt.note")}</p>
                <pre className="mt-4 max-h-[360px] overflow-auto rounded-xl border border-border bg-background/60 p-4 font-mono text-[11px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                  {result.mvp_prompt}
                </pre>
              </Card>
            </Reveal>

            {/* Roadmap */}
            <Reveal delay={0.48} className="sm:col-span-6">
              <Card>
                <Eyebrow>{t("autopsy.roadmap")}</Eyebrow>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  {(
                    [
                      ["autopsy.roadmap.w1", result.roadmap.week_1],
                      ["autopsy.roadmap.m1", result.roadmap.month_1],
                      ["autopsy.roadmap.m3", result.roadmap.month_3],
                      ["autopsy.roadmap.m6", result.roadmap.month_6],
                      ["autopsy.roadmap.y1", result.roadmap.year_1],
                    ] as Array<[TKey, string[]]>
                  ).map(([keyT, items], idx) => (
                    <motion.div
                      key={keyT}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.05 * idx, ease }}
                      className="rounded-xl border border-border bg-background/40 p-4"
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ember">
                        {t(keyT)}
                      </p>
                      <ul className="mt-3 space-y-2 text-xs leading-relaxed">
                        {items.map((it, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="font-mono text-muted-foreground">·</span>
                            <span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </Reveal>

            {/* Risks + Kill switches */}
            <Reveal delay={0.5} className="sm:col-span-4">
              <Card>
                <Eyebrow>{t("autopsy.risks")}</Eyebrow>
                <ul className="mt-5 space-y-3">
                  {result.risks.map((r, i) => (
                    <li key={i} className="rounded-xl border border-border bg-background/40 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                          {r.category}
                        </p>
                        <SeverityPill level={r.severity} />
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{r.risk}</p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        <span className="font-mono text-good">→ </span>
                        {r.mitigation}
                      </p>
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>

            <Reveal delay={0.52} className="sm:col-span-2">
              <Card>
                <Eyebrow>{t("autopsy.killswitches")}</Eyebrow>
                <ul className="mt-5 space-y-3">
                  {result.kill_switches.map((k, i) => (
                    <li key={i} className="rounded-xl border border-ember/20 bg-background/40 p-4">
                      <p className="font-mono text-[10px] text-ember">IF</p>
                      <p className="mt-2 text-sm leading-relaxed text-foreground/90">{k}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            </Reveal>

            {/* Brand names */}
            <Reveal delay={0.54} className="sm:col-span-6">
              <Card>
                <Eyebrow>{t("autopsy.names")}</Eyebrow>
                <ul className="mt-5 grid gap-3 sm:grid-cols-5">
                  {result.name_suggestions.map((n, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.04 * i, ease }}
                      className="rounded-xl border border-border bg-background/40 p-4"
                    >
                      <p className="font-display text-xl font-semibold tracking-tight text-gradient-ember">
                        {n.name}
                      </p>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {n.rationale}
                      </p>
                    </motion.li>
                  ))}
                </ul>
              </Card>
            </Reveal>

            {/* Survival kit */}
            <Reveal delay={0.56} className="sm:col-span-6">
              <Card accent>
                <Eyebrow accent>
                  {verdict === "kill" ? t("autopsy.kit.pivot") : t("autopsy.kit.survival")}
                </Eyebrow>
                <ol className="mt-5 grid gap-3 sm:grid-cols-3">
                  {result.survival_kit.map((item, i) => (
                    <motion.li
                      key={i}
                      initial={{ opacity: 0, y: 14 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.1 * i, ease }}
                      className="rounded-2xl border border-ember/20 bg-background/40 p-5"
                    >
                      <span className="font-mono text-sm text-ember">0{i + 1}</span>
                      <p className="mt-3 leading-relaxed text-foreground/90">{item}</p>
                    </motion.li>
                  ))}
                </ol>
              </Card>
            </Reveal>
          </LockedSection>
        </div>

        <Reveal delay={0.6}>
          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/kill"
              search={{ demo: false }}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-ember to-ember-glow px-7 py-3.5 text-sm font-semibold text-background shadow-[0_15px_50px_-15px_var(--ember)] transition-transform hover:scale-[1.03]"
            >
              {t("autopsy.cta")}
              <KnifeMark className="h-4 w-4" />
            </Link>
            <ShareMenu idea={idea} result={result} variant="cta" locked={locked} />
          </div>
        </Reveal>
      </div>
      <SiteFooter />
    </div>
  );
}

/* ---------- paywall ---------- */

function UnlockButton({ analysisId }: { analysisId?: string; userEmail?: string }) {
  const { openCheckout, loading, disabledReason } = usePaddleCheckout();
  const { user } = useAuth();

  const handleUnlock = async () => {
    if (!user || !analysisId) return;
    await openCheckout({
      priceId: "single_report_once",
      analysisId,
      successUrl: `${window.location.origin}/checkout/success?price=single_report_once${analysisId ? `&analysis=${analysisId}` : ""}`,
    });
  };

  if (!analysisId) {
    return (
      <div className="mt-5 rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-center text-sm text-muted-foreground">
        Run this idea from your account to unlock the full report.
      </div>
    );
  }

  if (disabledReason) {
    return (
      <button
        type="button"
        disabled
        title={disabledReason}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-ember to-ember-glow px-6 py-3 text-sm font-semibold text-background opacity-50"
      >
        Checkout disabled
        <KnifeMark className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      onClick={handleUnlock}
      disabled={loading || !!disabledReason}
      title={disabledReason ?? undefined}
      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-ember to-ember-glow px-6 py-3 text-sm font-semibold text-background shadow-[0_10px_40px_-10px_var(--ember)] transition-all hover:shadow-[0_15px_50px_-10px_var(--ember)] disabled:opacity-50"
    >
      {loading ? "Loading..." : "Unlock for €5"}
      <KnifeMark className="h-4 w-4" />
    </button>
  );
}

function LockedSection({
  children,
  locked,
  analysisId,
  userEmail,
}: {
  children: React.ReactNode;
  locked?: boolean;
  analysisId?: string;
  userEmail?: string;
}) {
  if (!locked) return <>{children}</>;
  return (
    <div className="col-span-full space-y-4">
      {/* Paywall banner — shown right at the start of locked content */}
      <div className="rounded-2xl border border-ember/30 bg-gradient-to-br from-surface to-background p-6 sm:p-8 shadow-[0_8px_40px_-12px_oklch(0.66_0.185_36/0.3)]">
        <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-ember to-ember-glow text-background shadow-[0_8px_30px_-8px_var(--ember)]">
            <KnifeMark className="h-7 w-7" />
          </div>
          <div className="flex-1">
            <p className="font-display text-xl font-semibold tracking-tight">
              Unlock the full autopsy
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">
              12-metric scoring, competitors, TAM/SAM/SOM, GTM, tech stack, roadmap, risks +
              survival kit. Everything to kill or ship your idea.
            </p>
          </div>
          <div className="shrink-0">
            <UnlockButton analysisId={analysisId} userEmail={userEmail} />
          </div>
        </div>
      </div>
      {/* Blurred preview — capped height so page doesn't scroll forever */}
      <div
        className="pointer-events-none select-none overflow-hidden rounded-2xl"
        style={{ maxHeight: "380px" }}
      >
        <div className="blur-md opacity-25">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ---------- share menu ---------- */

function ShareMenu({
  idea,
  result,
  variant,
  locked,
}: {
  idea: string;
  result: KillResult;
  variant: "ghost" | "cta";
  locked?: boolean;
}) {
  const { t } = useLang();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copy = async (key: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      /* ignore */
    }
  };

  const filename = `kill-my-idea-${slugify(idea)}.md`;
  const jsonName = `kill-my-idea-${slugify(idea)}.json`;

  // When locked: only allow short summary copy, block full exports
  const lockedTrigger =
    variant === "cta" ? (
      <button className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-7 py-3.5 text-sm font-medium backdrop-blur transition-colors hover:border-foreground/40">
        {t("autopsy.share.full")} <ChevronDown className="h-4 w-4" />
      </button>
    ) : (
      <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-4 py-2 text-xs font-medium backdrop-blur transition-colors hover:border-foreground/40">
        {t("autopsy.share")} <ChevronDown className="h-3 w-3" />
      </button>
    );

  if (locked) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{lockedTrigger}</DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-3 py-4 text-center">
            <KnifeMark className="mx-auto h-5 w-5 text-ember" />
            <p className="mt-2 text-sm font-semibold">Unlock to export</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Markdown, JSON and AI briefing available after unlocking the full report.
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => copy("short", formatAsShortSummary(idea, result))}
            className="flex flex-col items-start gap-0.5 py-2.5"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <MessageSquareQuote className="h-3.5 w-3.5" />
              {copiedKey === "short" ? t("autopsy.copied") : t("autopsy.share.short")}
            </span>
            <span className="text-[11px] text-muted-foreground">Verdict + score — free</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const trigger =
    variant === "cta" ? (
      <button className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-7 py-3.5 text-sm font-medium backdrop-blur transition-colors hover:border-foreground/40">
        {copiedKey ? t("autopsy.copied") : t("autopsy.share.full")}
        <ChevronDown className="h-4 w-4" />
      </button>
    ) : (
      <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-4 py-2 text-xs font-medium backdrop-blur transition-colors hover:border-foreground/40">
        {copiedKey ? t("autopsy.copied") : t("autopsy.share")}
        <ChevronDown className="h-3 w-3" />
      </button>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="text-xs">{t("autopsy.share.label")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => copy("md", formatAsMarkdown(idea, result))}
          className="flex flex-col items-start gap-0.5 py-2.5"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <FileText className="h-3.5 w-3.5" />
            {copiedKey === "md" ? t("autopsy.copied") : t("autopsy.share.markdown")}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {t("autopsy.share.markdown.hint")}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => copy("ai", formatAsAIBriefing(idea, result))}
          className="flex flex-col items-start gap-0.5 py-2.5"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <Bot className="h-3.5 w-3.5" />
            {copiedKey === "ai" ? t("autopsy.copied") : t("autopsy.share.ai")}
          </span>
          <span className="text-[11px] text-muted-foreground">{t("autopsy.share.ai.hint")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => copy("json", formatAsJSON(idea, result))}
          className="flex flex-col items-start gap-0.5 py-2.5"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <FileJson className="h-3.5 w-3.5" />
            {copiedKey === "json" ? t("autopsy.copied") : t("autopsy.share.json")}
          </span>
          <span className="text-[11px] text-muted-foreground">{t("autopsy.share.json.hint")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => copy("short", formatAsShortSummary(idea, result))}
          className="flex flex-col items-start gap-0.5 py-2.5"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <MessageSquareQuote className="h-3.5 w-3.5" />
            {copiedKey === "short" ? t("autopsy.copied") : t("autopsy.share.short")}
          </span>
          <span className="text-[11px] text-muted-foreground">{t("autopsy.share.short.hint")}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => downloadFile(filename, formatAsMarkdown(idea, result))}
          className="py-2"
        >
          <span className="flex items-center gap-2 text-sm">
            <Download className="h-3.5 w-3.5" />
            {t("autopsy.share.download.md")}
          </span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => downloadFile(jsonName, formatAsJSON(idea, result), "application/json")}
          className="py-2"
        >
          <span className="flex items-center gap-2 text-sm">
            <Download className="h-3.5 w-3.5" />
            {t("autopsy.share.download.json")}
          </span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------- atoms ---------- */

function Card({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <div
      className={`relative h-full overflow-hidden rounded-2xl border bg-surface/70 p-6 backdrop-blur sm:p-7 ${
        accent
          ? "border-ember/30 shadow-[0_30px_80px_-30px_oklch(0.66_0.185_36/0.3)]"
          : "border-border"
      }`}
    >
      {accent && (
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-ember/[0.07] via-transparent to-transparent" />
      )}
      {children}
    </div>
  );
}

function Eyebrow({ children, accent }: { children: React.ReactNode; accent?: boolean }) {
  return (
    <p
      className={`font-mono text-[11px] uppercase tracking-[0.2em] ${accent ? "text-ember" : "text-muted-foreground"}`}
    >
      / {children}
    </p>
  );
}

function SubEyebrow({ children, ember }: { children: React.ReactNode; ember?: boolean }) {
  return (
    <p
      className={`font-mono text-[10px] uppercase tracking-[0.18em] ${ember ? "text-ember" : "text-muted-foreground"}`}
    >
      {children}
    </p>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-lg font-semibold leading-tight tracking-tight sm:text-xl">
        {value}
      </p>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm leading-relaxed text-foreground/90">{value}</p>
    </div>
  );
}

function StackRow({ label, value, ember }: { label: string; value: string; ember?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span
        className={`text-right text-sm font-medium ${ember ? "text-ember" : "text-foreground"}`}
      >
        {value}
      </span>
    </div>
  );
}

function ScoreBar({ label, score, delay }: { label: string; score: number; delay: number }) {
  const pct = Math.max(0, Math.min(100, (score / 10) * 100));
  const color = score >= 7 ? "bg-good" : score >= 4 ? "bg-warn" : "bg-ember";
  const text = score >= 7 ? "text-good" : score >= 4 ? "text-warn" : "text-ember";
  return (
    <li>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className={`font-mono text-sm font-semibold ${text}`}>{score}/10</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-background/60">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.2 + delay, ease }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </li>
  );
}

function ScoreRing({ value }: { value: number }) {
  const { t } = useLang();
  const pct = Math.max(0, Math.min(100, (value / 10) * 100));
  const stroke = value >= 7 ? "stroke-good" : value >= 4 ? "stroke-warn" : "stroke-ember";
  const r = 28;
  const c = 2 * Math.PI * r;
  return (
    <div className="mt-5 flex items-center gap-3">
      <svg viewBox="0 0 70 70" className="h-16 w-16 -rotate-90">
        <circle cx="35" cy="35" r={r} className="stroke-border" strokeWidth="5" fill="none" />
        <motion.circle
          cx="35"
          cy="35"
          r={r}
          className={stroke}
          strokeWidth="5"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c - (c * pct) / 100 }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease }}
        />
      </svg>
      <span className="text-xs text-muted-foreground">
        {value >= 7
          ? t("autopsy.signal.strong")
          : value >= 4
            ? t("autopsy.signal.mixed")
            : t("autopsy.signal.weak")}
      </span>
    </div>
  );
}

function ThreatPill({ level, label }: { level: number; label: string }) {
  const tone =
    level >= 7
      ? "border-ember/40 text-ember bg-ember/10"
      : level >= 4
        ? "border-warn/40 text-warn bg-warn/10"
        : "border-good/40 text-good bg-good/10";
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] ${tone}`}
    >
      {label} {level}/10
    </span>
  );
}

function LikelihoodPill({ level }: { level: "low" | "medium" | "high" }) {
  const tone =
    level === "high"
      ? "border-ember/40 text-ember bg-ember/10"
      : level === "medium"
        ? "border-warn/40 text-warn bg-warn/10"
        : "border-good/40 text-good bg-good/10";
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] ${tone}`}
    >
      {level}
    </span>
  );
}

function EffortPill({ level, label }: { level: "low" | "medium" | "high"; label: string }) {
  const tone =
    level === "low"
      ? "border-good/40 text-good bg-good/10"
      : level === "medium"
        ? "border-warn/40 text-warn bg-warn/10"
        : "border-ember/40 text-ember bg-ember/10";
  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] ${tone}`}
    >
      {label}: {level}
    </span>
  );
}

function SeverityPill({ level }: { level: "low" | "medium" | "high" | "critical" }) {
  const tone =
    level === "critical" || level === "high"
      ? "border-ember/40 text-ember bg-ember/10"
      : level === "medium"
        ? "border-warn/40 text-warn bg-warn/10"
        : "border-good/40 text-good bg-good/10";
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] ${tone}`}
    >
      {level}
    </span>
  );
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
