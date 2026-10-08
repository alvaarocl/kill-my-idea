import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Unlock, Lock, ChevronRight } from "lucide-react";
import { useState } from "react";
import { SiteHeader, KnifeMark } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/lib/auth";
import { listAnalyses, deleteAnalysis, type AnalysisListItem } from "@/lib/analyses.functions";

export const Route = createFileRoute("/my-autopsies")({
  head: () => ({
    meta: [{ title: "Mis autopsias · Kill My Idea" }, { name: "robots", content: "noindex" }],
  }),
  component: MyAutopsiesPage,
});

const ease = [0.22, 1, 0.36, 1] as const;

const VERDICT_META = {
  ship: { emoji: "🚀", label: "Ship it", cls: "text-good  bg-good/10  border-good/30" },
  pivot: { emoji: "⚠️", label: "Pivot", cls: "text-warn  bg-warn/10  border-warn/30" },
  kill: { emoji: "☠️", label: "Kill it", cls: "text-ember bg-ember/10 border-ember/30" },
} as const;

function MyAutopsiesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fetchList = useServerFn(listAnalyses);
  const removeFn = useServerFn(deleteAnalysis);

  const {
    data: analyses,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["my-analyses"],
    queryFn: () => fetchList(),
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeFn({ data: { id } }),
    onSuccess: () => refetch(),
  });

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (!loading && !user) {
    navigate({ to: "/auth", search: { redirect: "/my-autopsies" } });
    return null;
  }

  const stats = analyses
    ? {
        total: analyses.length,
        ship: analyses.filter((a) => a.verdict === "ship").length,
        pivot: analyses.filter((a) => a.verdict === "pivot").length,
        kill: analyses.filter((a) => a.verdict === "kill").length,
        unlocked: analyses.filter((a) => a.unlocked).length,
      }
    : null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-5 py-14">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ember">/ mis autopsias</p>
          <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">
            Historial de ideas
          </h1>
          <p className="mt-3 text-muted-foreground">
            Todas las autopsias que has lanzado. Las bloqueadas muestran solo el resumen —
            desbloquéalas para ver el informe completo.
          </p>
        </motion.div>

        {/* Stats */}
        {stats && stats.total > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease }}
            className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            <StatCard label="Total" value={stats.total} />
            <StatCard label="🚀 Ship" value={stats.ship} color="text-good" />
            <StatCard label="⚠️ Pivot" value={stats.pivot} color="text-warn" />
            <StatCard label="☠️ Kill" value={stats.kill} color="text-ember" />
          </motion.div>
        )}

        {/* List */}
        <div className="mt-8">
          {isLoading && (
            <div className="grid place-items-center py-24 text-sm text-muted-foreground">
              Cargando…
            </div>
          )}

          {!isLoading && (!analyses || analyses.length === 0) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-border py-20 text-center"
            >
              <KnifeMark className="h-10 w-10 text-muted-foreground/40" />
              <div>
                <p className="font-display text-xl font-semibold">Ninguna autopsia todavía</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Analiza tu primera idea y aparecerá aquí.
                </p>
              </div>
              <Link
                to="/kill"
                search={{ demo: false }}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-ember to-ember-glow px-6 py-3 text-sm font-semibold text-background shadow-[0_10px_40px_-10px_var(--ember)] transition-transform hover:scale-[1.03]"
              >
                Lanzar autopsia <KnifeMark className="h-4 w-4" />
              </Link>
            </motion.div>
          )}

          <AnimatePresence initial={false}>
            {analyses?.map((item, i) => (
              <AnalysisRow
                key={item.id}
                item={item}
                index={i}
                onDelete={() => setConfirmDelete(item.id)}
                isConfirming={confirmDelete === item.id}
                onConfirmDelete={() => {
                  deleteMutation.mutate(item.id);
                  setConfirmDelete(null);
                }}
                onCancelDelete={() => setConfirmDelete(null)}
              />
            ))}
          </AnimatePresence>
        </div>

        {analyses && analyses.length > 0 && (
          <div className="mt-8 text-center">
            <Link
              to="/kill"
              search={{ demo: false }}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-6 py-3 text-sm font-medium transition-colors hover:border-foreground/40"
            >
              <KnifeMark className="h-4 w-4" /> Nueva autopsia
            </Link>
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}

function AnalysisRow({
  item,
  index,
  onDelete,
  isConfirming,
  onConfirmDelete,
  onCancelDelete,
}: {
  item: AnalysisListItem;
  index: number;
  onDelete: () => void;
  isConfirming: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  const verdict = (item.verdict as keyof typeof VERDICT_META) ?? null;
  const meta = verdict ? VERDICT_META[verdict] : null;
  const date = new Date(item.created_at).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4, delay: index * 0.03, ease: [0.22, 1, 0.36, 1] }}
      className="group relative border-b border-border/60 py-5 first:border-t"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: content */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {/* Verdict badge */}
            {meta && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${meta.cls}`}
              >
                {meta.emoji} {meta.label}
              </span>
            )}
            {/* Score */}
            {item.score != null && (
              <span className="font-mono text-xs text-muted-foreground">{item.score}/10</span>
            )}
            {/* Lock status */}
            {item.unlocked ? (
              <span className="flex items-center gap-1 text-[11px] text-good">
                <Unlock className="h-3 w-3" /> Desbloqueado
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Lock className="h-3 w-3" /> Bloqueado
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">{date}</span>
          </div>

          {/* Idea text */}
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/90">
            {item.idea}
          </p>

          {/* One-liner */}
          {item.one_liner && (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground italic">
              {item.one_liner}
            </p>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex shrink-0 items-center gap-2 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
          <Link
            to="/autopsy"
            search={{ id: item.id }}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs font-medium transition-colors hover:border-foreground/40"
          >
            Ver <ChevronRight className="h-3 w-3" />
          </Link>
          {!isConfirming ? (
            <button
              type="button"
              onClick={onDelete}
              className="grid h-7 w-7 place-items-center rounded-full border border-border bg-surface/60 text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onConfirmDelete}
                className="rounded-full bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground"
              >
                Eliminar
              </button>
              <button
                type="button"
                onClick={onCancelDelete}
                className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface/40 p-4 text-center backdrop-blur">
      <p className={`font-display text-3xl font-semibold ${color ?? "text-foreground"}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
