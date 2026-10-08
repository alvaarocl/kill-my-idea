import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { SiteHeader, KnifeMark } from "@/components/site-header";
import { PricingGrid } from "@/components/pricing-section";
import { SiteFooter } from "@/components/site-footer";
import { useLang, type TKey } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kill My Idea — A brutally honest startup advisor" },
      {
        name: "description",
        content:
          "Drop your startup idea. Get a sharp VC-style roast, a 6-metric autopsy, named competitors, TAM estimate, and a survival kit. Zero sugarcoating.",
      },
      { property: "og:title", content: "Kill My Idea — Brutally honest startup advisor" },
      {
        property: "og:description",
        content: "Brutal honesty. Zero sugarcoating. Find out if your idea deserves to live.",
      },
    ],
  }),
  component: Landing,
});

const ease = [0.22, 1, 0.36, 1] as const;

function Landing() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <SiteHeader />
      <Hero />
      <BentoFeatures />
      <DeepReport />
      <HowItWorks />
      <Sample />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionEyebrow>Pricing</SectionEyebrow>
        <SectionTitle>
          Pay for the truth. <span className="text-gradient-ember">Skip the hopium</span>.
        </SectionTitle>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
          className="mt-5 max-w-2xl text-base text-muted-foreground"
        >
          Start free. Upgrade only when an idea is worth defending. VAT and billing handled by
          Paddle.
        </motion.p>

        <PricingGrid />

        <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted-foreground">
          All prices in EUR · Cancel anytime · Merchant of Record: Paddle
        </p>
      </div>
    </section>
  );
}

/* -------------------------------------------------- Deep report preview */

type DeepItem = { eyebrowKey: TKey; bodyKey: TKey; tag: string; className?: string };

const DEEP_ITEMS: DeepItem[] = [
  {
    eyebrowKey: "deep.item.scores",
    bodyKey: "deep.item.scores.body",
    tag: "12 / 10",
    className: "sm:col-span-3",
  },
  {
    eyebrowKey: "deep.item.market",
    bodyKey: "deep.item.market.body",
    tag: "TAM · SAM · SOM",
    className: "sm:col-span-3",
  },
  {
    eyebrowKey: "deep.item.personas",
    bodyKey: "deep.item.personas.body",
    tag: "× 3 ICP",
    className: "sm:col-span-2",
  },
  {
    eyebrowKey: "deep.item.competitors",
    bodyKey: "deep.item.competitors.body",
    tag: "5–7",
    className: "sm:col-span-2",
  },
  {
    eyebrowKey: "deep.item.bigtech",
    bodyKey: "deep.item.bigtech.body",
    tag: "FAANG+",
    className: "sm:col-span-2",
  },
  {
    eyebrowKey: "deep.item.dead",
    bodyKey: "deep.item.dead.body",
    tag: "☠",
    className: "sm:col-span-2",
  },
  {
    eyebrowKey: "deep.item.model",
    bodyKey: "deep.item.model.body",
    tag: "CAC · LTV",
    className: "sm:col-span-2",
  },
  {
    eyebrowKey: "deep.item.gtm",
    bodyKey: "deep.item.gtm.body",
    tag: "Wedge",
    className: "sm:col-span-2",
  },
  {
    eyebrowKey: "deep.item.stack",
    bodyKey: "deep.item.stack.body",
    tag: "Stack",
    className: "sm:col-span-2",
  },
  {
    eyebrowKey: "deep.item.prompt",
    bodyKey: "deep.item.prompt.body",
    tag: "Copy-paste",
    className: "sm:col-span-2",
  },
  {
    eyebrowKey: "deep.item.roadmap",
    bodyKey: "deep.item.roadmap.body",
    tag: "W1 → Y1",
    className: "sm:col-span-2",
  },
  {
    eyebrowKey: "deep.item.risks",
    bodyKey: "deep.item.risks.body",
    tag: "× 4+",
    className: "sm:col-span-3",
  },
  {
    eyebrowKey: "deep.item.names",
    bodyKey: "deep.item.names.body",
    tag: "× 5",
    className: "sm:col-span-3",
  },
];

function DeepReport() {
  const { t } = useLang();
  return (
    <section id="report" className="px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionEyebrow>{t("deep.eyebrow")}</SectionEyebrow>
        <SectionTitle>
          {t("deep.title.a")}
          <span className="text-gradient-ember">{t("deep.title.b")}</span>.
        </SectionTitle>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
          className="mt-5 max-w-2xl text-base text-muted-foreground"
        >
          {t("deep.subtitle")}
        </motion.p>

        <div className="mt-14 grid auto-rows-fr grid-cols-1 gap-3 sm:grid-cols-6">
          {DEEP_ITEMS.map((it, i) => (
            <motion.div
              key={it.eyebrowKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: i * 0.03, ease }}
              className={`group relative overflow-hidden rounded-2xl border border-border bg-surface/70 p-5 transition-colors hover:border-foreground/20 sm:p-6 ${it.className ?? ""}`}
            >
              <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-ember/[0.05] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-display text-lg font-semibold tracking-tight sm:text-xl">
                  {t(it.eyebrowKey)}
                </p>
                <span className="rounded-full border border-ember/30 bg-ember/5 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ember">
                  {it.tag}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t(it.bodyKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- Hero */

function Hero() {
  const { t } = useLang();
  return (
    <section className="relative px-5 pb-24 pt-16 sm:pt-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-ember/15 blur-[140px]" />
        <div className="absolute left-1/3 top-40 h-72 w-72 rounded-full bg-ember-glow/10 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
          className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ember" />
          {t("hero.badge")}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05, ease }}
          className="mt-6 font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-7xl md:text-[88px]"
        >
          {t("hero.title.line1")}
          <br />
          {t("hero.title.line2a")}
          <span className="relative inline-block">
            <span className="text-gradient-ember">{t("hero.title.line2b")}</span>
            <motion.svg
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.5, ease }}
              viewBox="0 0 300 12"
              className="absolute -bottom-2 left-0 h-3 w-full"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            >
              <motion.path d="M3 7 Q 80 1, 150 6 T 297 5" className="text-ember" />
            </motion.svg>
          </span>
          {t("hero.title.dot")}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease }}
          className="mx-auto mt-7 max-w-xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          {t("hero.subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            to="/kill"
            search={{ demo: false }}
            className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-ember to-ember-glow px-7 py-3.5 text-base font-semibold text-background shadow-[0_15px_50px_-15px_var(--ember)] transition-all hover:scale-[1.03] active:scale-[0.98]"
          >
            {t("hero.cta.primary")}
            <KnifeMark className="h-4 w-4 transition-transform group-hover:rotate-12" />
          </Link>
          <Link
            to="/kill"
            search={{ demo: true }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-6 py-3.5 text-sm font-medium text-foreground backdrop-blur transition-colors hover:border-foreground/40"
          >
            {t("hero.cta.secondary")} <span aria-hidden>→</span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
        >
          <span>{t("hero.trust.1")}</span>
          <span>{t("hero.trust.2")}</span>
          <span>{t("hero.trust.3")}</span>
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- Bento features */

function BentoFeatures() {
  const { t } = useLang();
  return (
    <section id="features" className="px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionEyebrow>{t("features.eyebrow")}</SectionEyebrow>
        <SectionTitle>
          {t("features.title.line1")}
          <br />
          {t("features.title.line2a")}
          <span className="text-gradient-ember">{t("features.title.line2b")}</span>.
        </SectionTitle>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-6">
          <BentoCard className="sm:col-span-4 sm:row-span-2" delay={0}>
            <CardEyebrow>{t("features.roast.eyebrow")}</CardEyebrow>
            <p className="mt-3 font-display text-2xl font-medium leading-tight sm:text-3xl">
              {t("features.roast.body.before")}
              <span className="text-ember">{t("features.roast.body.accent")}</span>
              {t("features.roast.body.after")}
            </p>
            <FauxRoast />
          </BentoCard>

          <BentoCard className="sm:col-span-2" delay={0.05}>
            <CardEyebrow>{t("features.verdict.eyebrow")}</CardEyebrow>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-display text-3xl font-semibold">
                {t("features.verdict.ship")}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="font-display text-3xl font-semibold text-warn">
                {t("features.verdict.pivot")}
              </span>
              <span className="text-muted-foreground">·</span>
              <span className="font-display text-3xl font-semibold text-ember">
                {t("features.verdict.kill")}
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t("features.verdict.note")}</p>
          </BentoCard>

          <BentoCard className="sm:col-span-2" delay={0.1}>
            <CardEyebrow>{t("features.scores.eyebrow")}</CardEyebrow>
            <div className="mt-4 space-y-2.5">
              {(
                [
                  ["metric.market_size", 78],
                  ["metric.competition", 40],
                  ["metric.execution", 62],
                  ["metric.timing", 85],
                  ["metric.originality", 28],
                  ["metric.moat", 35],
                ] as Array<[TKey, number]>
              ).map(([key, pct], i) => (
                <MiniBar key={key} label={t(key)} pct={pct} delay={0.15 + i * 0.04} />
              ))}
            </div>
          </BentoCard>

          <BentoCard className="sm:col-span-3" delay={0.15}>
            <CardEyebrow>{t("features.market.eyebrow")}</CardEyebrow>
            <p className="mt-3 font-display text-xl font-medium">{t("features.market.body")}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {["Notion", "Linear", "Figma", "Superhuman", "+2"].map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-border bg-background/40 px-3 py-1 font-mono"
                >
                  {c}
                </span>
              ))}
            </div>
          </BentoCard>

          <BentoCard className="sm:col-span-3" delay={0.2}>
            <CardEyebrow>{t("features.kit.eyebrow")}</CardEyebrow>
            <p className="mt-3 font-display text-xl font-medium">{t("features.kit.body")}</p>
            <ol className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-mono text-ember">01</span> {t("features.kit.sample.1")}
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-ember">02</span> {t("features.kit.sample.2")}
              </li>
              <li className="flex gap-3">
                <span className="font-mono text-ember">03</span> {t("features.kit.sample.3")}
              </li>
            </ol>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay, ease }}
      className={`group relative overflow-hidden rounded-2xl border border-border bg-surface/70 p-6 transition-colors hover:border-foreground/20 sm:p-7 ${className}`}
    >
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ember/[0.05] via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      {children}
    </motion.div>
  );
}

function CardEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
      {children}
    </p>
  );
}

function MiniBar({ label, pct, delay }: { label: string; pct: number; delay: number }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="text-foreground/80">{label}</span>
        <span className="font-mono text-muted-foreground">{Math.round(pct / 10)}/10</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-background/60">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay, ease }}
          className={`h-full rounded-full ${pct >= 70 ? "bg-good" : pct >= 40 ? "bg-warn" : "bg-ember"}`}
        />
      </div>
    </div>
  );
}

function FauxRoast() {
  const { t } = useLang();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="mt-6 rounded-xl border border-ember/30 bg-background/40 p-5 text-sm leading-relaxed text-foreground/90 sm:text-base"
    >
      <span className="text-ember">"</span>
      {t("features.roast.sample")}
      <span className="text-ember">"</span>
    </motion.div>
  );
}

/* -------------------------------------------------- How it works */

function HowItWorks() {
  const { t } = useLang();
  const steps = [
    { n: "01", title: t("how.step1.title"), body: t("how.step1.body") },
    { n: "02", title: t("how.step2.title"), body: t("how.step2.body") },
    { n: "03", title: t("how.step3.title"), body: t("how.step3.body") },
  ];

  return (
    <section id="how" className="px-5 py-24">
      <div className="mx-auto max-w-6xl">
        <SectionEyebrow>{t("how.eyebrow")}</SectionEyebrow>
        <SectionTitle>
          {t("how.title.a")}
          <span className="text-gradient-ember">{t("how.title.b")}</span>
        </SectionTitle>

        <div className="mt-14 grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease }}
              className="rounded-2xl border border-border bg-surface/70 p-7"
            >
              <div className="font-mono text-sm text-ember">{s.n}</div>
              <h3 className="mt-3 font-display text-2xl font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- Sample */

function Sample() {
  const { t } = useLang();
  return (
    <section id="sample" className="px-5 py-24">
      <div className="mx-auto max-w-5xl">
        <SectionEyebrow>{t("sample.eyebrow")}</SectionEyebrow>
        <SectionTitle>{t("sample.title")}</SectionTitle>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, ease }}
          className="mt-12 overflow-hidden rounded-3xl border border-border bg-surface/70 p-8 shadow-[0_30px_80px_-30px_oklch(0_0_0/0.7)] sm:p-10"
        >
          <div className="flex items-center justify-between border-b border-border pb-5">
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-ember" />
              {t("sample.casefile")}
            </div>
            <div className="rounded-full border border-ember/40 bg-ember/10 px-3 py-1 text-xs font-semibold text-ember">
              {t("sample.verdictTag")}
            </div>
          </div>

          <p className="mt-6 font-display text-2xl font-medium leading-snug sm:text-3xl">
            {t("sample.idea")}
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div>
              <CardEyebrow>{t("sample.roast.eyebrow")}</CardEyebrow>
              <p className="mt-2 text-sm leading-relaxed text-foreground/90 sm:text-base">
                {t("sample.roast.body")}
              </p>
            </div>
            <div>
              <CardEyebrow>{t("sample.tam.eyebrow")}</CardEyebrow>
              <p className="mt-2 font-display text-3xl font-semibold">{t("sample.tam.value")}</p>
              <p className="text-xs text-muted-foreground">{t("sample.tam.note")}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2, ease }}
          className="mt-10 flex flex-col items-center gap-4"
        >
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
            / pruébalo ahora — gratis, sin cuenta
          </p>
          <Link
            to="/kill"
            search={{ demo: true }}
            className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-br from-ember to-ember-glow px-8 py-4 text-base font-semibold text-background shadow-[0_20px_60px_-15px_var(--ember)] transition-all hover:scale-[1.03] hover:shadow-[0_25px_70px_-15px_var(--ember)] active:scale-[0.98]"
          >
            Ver autopsia de ejemplo
            <KnifeMark className="h-4 w-4 transition-transform group-hover:rotate-12" />
          </Link>
          <p className="text-xs text-muted-foreground">
            El sistema elige una idea aleatoria · Resultado completo · Sin registro
          </p>
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- FAQ */

function FAQ() {
  const { t } = useLang();
  const items: Array<{ q: TKey; a: TKey }> = [
    { q: "faq.q1", a: "faq.a1" },
    { q: "faq.q2", a: "faq.a2" },
    { q: "faq.q3", a: "faq.a3" },
    { q: "faq.q4", a: "faq.a4" },
  ];

  return (
    <section id="faq" className="px-5 py-24">
      <div className="mx-auto max-w-3xl">
        <SectionEyebrow>{t("faq.eyebrow")}</SectionEyebrow>
        <SectionTitle>{t("faq.title")}</SectionTitle>

        <div className="mt-12 divide-y divide-border">
          {items.map((it, i) => (
            <motion.details
              key={it.q}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05, ease }}
              className="group py-5"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-lg font-medium tracking-tight">
                {t(it.q)}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {t(it.a)}
              </p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------- Final CTA */

function FinalCTA() {
  const { t } = useLang();
  return (
    <section className="px-5 pb-32 pt-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-ember/30 bg-gradient-to-br from-surface to-background p-10 text-center sm:p-16"
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-ember/30 blur-[100px]" />
          <div className="absolute -bottom-20 -right-10 h-80 w-80 rounded-full bg-ember-glow/20 blur-[120px]" />
        </div>

        <h2 className="font-display text-4xl font-semibold tracking-tight sm:text-6xl">
          {t("finalcta.title.a")}
          <br />
          <span className="text-gradient-ember">{t("finalcta.title.b")}</span>
        </h2>
        <p className="mx-auto mt-5 max-w-md text-muted-foreground">{t("finalcta.body")}</p>
        <Link
          to="/kill"
          search={{ demo: false }}
          className="mt-9 inline-flex items-center gap-2 rounded-full bg-foreground px-8 py-4 text-base font-semibold text-background transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          {t("finalcta.button")}
          <KnifeMark className="h-4 w-4" />
        </Link>
      </motion.div>
    </section>
  );
}

function Footer() {
  return <SiteFooter />;
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease }}
      className="font-mono text-xs uppercase tracking-[0.22em] text-ember"
    >
      / {children}
    </motion.p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <motion.h2
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease }}
      className="mt-3 font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl"
    >
      {children}
    </motion.h2>
  );
}
