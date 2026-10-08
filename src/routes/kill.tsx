import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { killIdea } from "@/lib/analyze.functions";
import { saveResult } from "@/lib/result-store";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader, KnifeMark } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useLang, type TKey } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { pickRandomIdea } from "@/lib/random-ideas";
import { toast } from "sonner";

export const Route = createFileRoute("/kill")({
  validateSearch: (search: Record<string, unknown>) => ({
    demo: search.demo === "1" || search.demo === true,
  }),
  head: () => ({
    meta: [
      { title: "Kill My Idea — Describe your startup" },
      {
        name: "description",
        content: "Type your startup idea and get a brutally honest autopsy in 90 seconds.",
      },
      { property: "og:title", content: "Kill My Idea — Describe your startup" },
      {
        property: "og:description",
        content: "Type your startup idea and get a brutally honest autopsy in 90 seconds.",
      },
    ],
  }),
  component: KillPage,
});

const ease = [0.22, 1, 0.36, 1] as const;

const LOADING_KEYS: TKey[] = [
  "kill.loading.1",
  "kill.loading.2",
  "kill.loading.3",
  "kill.loading.4",
  "kill.loading.5",
  "kill.loading.6",
  "kill.loading.7",
];

const PROMPT_KEYS: TKey[] = [
  "kill.placeholder.1",
  "kill.placeholder.2",
  "kill.placeholder.3",
  "kill.placeholder.4",
];

function KillPage() {
  const killFn = useServerFn(killIdea);
  const navigate = useNavigate();
  const { t, lang } = useLang();
  const { user, loading } = useAuth();
  const { demo } = Route.useSearch();
  const [idea, setIdea] = useState("");
  const [market, setMarket] = useState("");
  const [context, setContext] = useState("");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);

  const prompts = useMemo(() => PROMPT_KEYS.map((k) => t(k)), [t]);

  const mutation = useMutation({
    mutationFn: (payload: {
      idea: string;
      market?: string;
      context?: string;
      mode?: "demo" | "personal";
      lang?: string;
      authToken?: string;
    }) =>
      killFn({
        data: {
          idea: payload.idea,
          lang: payload.lang ?? lang,
          market: payload.market || undefined,
          context: payload.context || undefined,
          mode: payload.mode,
          authToken: payload.authToken,
        },
      }),
    onError: (err: Error) => {
      toast.error(err.message || "Something went wrong. Try again.");
    },
    onSuccess: (data, vars) => {
      if (vars.mode === "personal" && data.analysisId) {
        // Personal analyses are in the DB — navigate directly, skip sessionStorage
        saveResult({
          idea: vars.idea,
          result: data.result,
          at: Date.now(),
          locked: data.locked,
          analysisId: data.analysisId,
          mode: vars.mode,
        });
        navigate({ to: "/autopsy", search: { id: data.analysisId } });
      } else {
        // Demo mode has no DB record — use sessionStorage for the trip to /autopsy
        saveResult({
          idea: vars.idea,
          result: data.result,
          at: Date.now(),
          locked: data.locked,
          analysisId: data.analysisId ?? undefined,
          mode: vars.mode,
        });
        navigate({ to: "/autopsy", search: { id: undefined } });
      }
    },
  });

  useEffect(() => {
    if (idea.length > 0) return;
    const id = setInterval(() => {
      setPromptIndex((i) => (i + 1) % PROMPT_KEYS.length);
    }, 2800);
    return () => clearInterval(id);
  }, [idea]);

  // Auto-launch demo if ?demo=1 is in the URL
  useEffect(() => {
    if (!demo || mutation.isPending) return;
    const randomIdea = pickRandomIdea();
    mutation.mutate({ idea: randomIdea, mode: "demo", lang });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo]);

  const submit = async () => {
    const trimmed = idea.trim();
    if (trimmed.length < 10 || mutation.isPending) return;

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      toast.error("Your session is not available in this browser. Please sign in again.");
      navigate({ to: "/auth", search: { redirect: "/kill" } });
      return;
    }

    mutation.mutate({
      idea: trimmed,
      market: market.trim(),
      context: context.trim(),
      mode: "personal",
      authToken: token,
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <SiteHeader />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-20 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-ember/10 blur-[140px]" />
      </div>

      <div className="mx-auto max-w-2xl px-5 pb-24 pt-16 sm:pt-24">
        <AnimatePresence mode="wait">
          {!mutation.isPending ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease }}
            >
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("kill.back")}
              </Link>

              <h1 className="mt-6 font-display text-5xl font-semibold leading-[0.95] tracking-tight sm:text-6xl">
                {t("kill.title.a")}
                <br />
                <span className="text-gradient-ember">{t("kill.title.b")}</span>
              </h1>
              <p className="mt-5 max-w-md text-muted-foreground">{t("kill.subtitle")}</p>

              <form
                className="mt-10"
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface/80 backdrop-blur transition-colors focus-within:border-ember/60 focus-within:shadow-[0_0_0_4px_oklch(0.66_0.185_36/0.1)]">
                  <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder={prompts[promptIndex]}
                    maxLength={2000}
                    rows={7}
                    autoFocus
                    className="w-full resize-none bg-transparent px-6 py-5 text-base leading-relaxed outline-none placeholder:text-muted-foreground/50 sm:text-lg"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        submit();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between border-t border-border/60 px-6 py-2.5 text-xs text-muted-foreground">
                    <span className="font-mono">{idea.length} / 2000</span>
                    <span className="hidden sm:inline">
                      <kbd className="rounded border border-border bg-background/60 px-1.5 py-0.5 font-mono">
                        ⌘
                      </kbd>{" "}
                      <kbd className="rounded border border-border bg-background/60 px-1.5 py-0.5 font-mono">
                        Enter
                      </kbd>{" "}
                      {t("kill.kbdHint")}
                    </span>
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface/40">
                  <button
                    type="button"
                    onClick={() => setAdvancedOpen((v) => !v)}
                    className="flex w-full items-center justify-between px-5 py-3 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <span className="font-mono text-ember">+</span>
                      {t("kill.advanced.toggle")}
                      {(market || context) && (
                        <span className="rounded-full bg-ember/15 px-2 py-0.5 font-mono text-[10px] text-ember">
                          {[market && "market", context && "context"].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </span>
                    <motion.span animate={{ rotate: advancedOpen ? 180 : 0 }} className="font-mono">
                      ⌄
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {advancedOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-5 border-t border-border/60 px-5 py-5">
                          <div>
                            <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                              {t("kill.advanced.marketLabel")}
                            </label>
                            <input
                              type="text"
                              value={market}
                              onChange={(e) => setMarket(e.target.value)}
                              placeholder={t("kill.advanced.marketPlaceholder")}
                              maxLength={120}
                              className="mt-2 w-full rounded-lg border border-border bg-background/60 px-4 py-2.5 text-sm outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-ember/60"
                            />
                            <p className="mt-1.5 text-[11px] text-muted-foreground">
                              {t("kill.advanced.marketHint")}
                            </p>
                          </div>
                          <div>
                            <label className="block font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                              {t("kill.advanced.contextLabel")}
                            </label>
                            <textarea
                              value={context}
                              onChange={(e) => setContext(e.target.value)}
                              placeholder={t("kill.advanced.contextPlaceholder")}
                              maxLength={2000}
                              rows={4}
                              className="mt-2 w-full resize-none rounded-lg border border-border bg-background/60 px-4 py-3 text-sm leading-relaxed outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-ember/60"
                            />
                            <p className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>{t("kill.advanced.contextHint")}</span>
                              <span className="font-mono">{context.length} / 2000</span>
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={idea.trim().length < 10 || mutation.isPending}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-br from-ember to-ember-glow px-7 py-4 text-base font-semibold text-background shadow-[0_15px_50px_-15px_var(--ember)] transition-all hover:shadow-[0_20px_60px_-15px_var(--ember)] disabled:cursor-not-allowed disabled:from-muted disabled:to-muted disabled:text-muted-foreground disabled:shadow-none"
                >
                  {!user && !loading ? "Sign in to analyze your idea" : t("kill.submit")}
                  <KnifeMark className="h-4 w-4" />
                </motion.button>

                <button
                  type="button"
                  onClick={() => {
                    const randomIdea = pickRandomIdea();
                    mutation.mutate({ idea: randomIdea, lang, mode: "demo" });
                  }}
                  disabled={mutation.isPending}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:opacity-50"
                >
                  Try with a random idea <span aria-hidden>→</span>
                </button>

                {mutation.isError && (
                  <p className="mt-4 rounded-lg border border-ember/30 bg-ember/5 px-4 py-3 text-center text-sm text-ember">
                    {(mutation.error as Error).message}
                  </p>
                )}

                <div className="mt-8">
                  <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    / {t("kill.tryThese")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {prompts.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setIdea(p)}
                        className="rounded-full border border-border bg-surface/60 px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </form>
            </motion.div>
          ) : (
            <Loading key="loading" />
          )}
        </AnimatePresence>
      </div>
      <SiteFooter />
    </div>
  );
}

function Loading() {
  const { t } = useLang();
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStepIndex((i) => (i + 1) % LOADING_KEYS.length);
    }, 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <motion.div
        animate={{ rotate: [0, -18, 18, -12, 12, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="relative grid h-24 w-24 place-items-center rounded-2xl bg-gradient-to-br from-ember to-ember-glow text-background shadow-[0_25px_80px_-15px_var(--ember)]"
      >
        <KnifeMark className="h-12 w-12" />
      </motion.div>

      <div className="mt-10 h-7 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.4, ease }}
            className="font-display text-xl font-medium tracking-tight sm:text-2xl"
          >
            {t(LOADING_KEYS[stepIndex])}
          </motion.p>
        </AnimatePresence>
      </div>

      <div className="mt-6 flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
            className="h-2 w-2 rounded-full bg-ember"
          />
        ))}
      </div>

      <p className="mt-10 max-w-xs text-xs text-muted-foreground">{t("kill.loading.note")}</p>
    </motion.div>
  );
}
