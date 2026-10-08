import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { usePaddleCheckout } from "@/hooks/usePaddleCheckout";
import { KnifeMark } from "@/components/site-header";

const ease = [0.22, 1, 0.36, 1] as const;

export type Tier = {
  id: "free" | "single" | "founder" | "pro";
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  features: string[];
  cta: string;
  priceId?: "single_report_once" | "founder_monthly" | "pro_monthly";
  highlight?: boolean;
};

export const TIERS: Tier[] = [
  {
    id: "free",
    name: "Free",
    price: "€0",
    cadence: "forever",
    tagline: "Try with a random idea — full report, no account.",
    features: [
      "Demo con idea random",
      "Resultado completo, sin blur",
      "Sin registro requerido",
      "Tu propia idea → desde €5",
    ],
    cta: "Try demo",
  },
  {
    id: "single",
    name: "Single Report",
    price: "€5",
    cadence: "one-time",
    tagline: "Una idea tuya. Informe completo. Sin suscripción.",
    features: [
      "Desbloquea 1 autopsia completa",
      "Las 13+ secciones, sin blur",
      "Exporta Markdown / JSON",
      "Comparte con co-fundadores",
    ],
    cta: "Buy one report",
    priceId: "single_report_once",
  },
  {
    id: "founder",
    name: "Founder",
    price: "€19",
    cadence: "per month",
    tagline: "20 autopsias al mes de tus propias ideas.",
    features: [
      "20 autopsias / mes",
      "Todas las secciones y exportes",
      "Historial guardado",
      "Modelo IA prioritario",
    ],
    cta: "Go Founder",
    priceId: "founder_monthly",
    highlight: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "€49",
    cadence: "per month",
    tagline: "Ilimitado. Para los que matan ideas en serie.",
    features: [
      "Autopsias ilimitadas",
      "Compara ideas en paralelo",
      "Export PDF listo para inversores",
      "Escaneo real de competidores web",
    ],
    cta: "Go Pro",
    priceId: "pro_monthly",
  },
];

export function PricingGrid({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { openCheckout, loading, disabledReason } = usePaddleCheckout();

  const handleBuy = async (tier: Tier) => {
    if (!tier.priceId) {
      navigate({ to: "/kill", search: { demo: false } });
      return;
    }
    if (!user) {
      navigate({ to: "/auth", search: { redirect: tier.id === "single" ? "/kill" : "/pricing" } });
      return;
    }
    if (tier.id === "single") {
      navigate({ to: "/kill", search: { demo: false } });
      return;
    }
    await openCheckout({
      priceId: tier.priceId,
      successUrl: `${window.location.origin}/checkout/success?price=${tier.priceId}`,
    });
  };

  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 ${compact ? "" : "mt-14"}`}>
      {TIERS.map((tier, i) => (
        <motion.div
          key={tier.id}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: i * 0.06, ease }}
          className={`group relative flex flex-col overflow-hidden rounded-2xl border p-6 transition-colors sm:p-7 ${
            tier.highlight
              ? "border-ember/40 bg-gradient-to-br from-surface to-background shadow-[0_30px_80px_-40px_var(--ember)]"
              : "border-border bg-surface/70 hover:border-foreground/20"
          }`}
        >
          {tier.highlight && (
            <>
              <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-ember/20 blur-[80px]" />
                <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-ember-glow/15 blur-[80px]" />
              </div>
              <div className="absolute right-5 top-5 rounded-full border border-ember/40 bg-ember/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-ember">
                Most picked
              </div>
            </>
          )}

          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            {tier.name}
          </p>
          <p className="mt-2 min-h-10 text-sm text-muted-foreground">{tier.tagline}</p>

          <div className="mt-4 flex items-baseline gap-1.5">
            <span className="font-display text-4xl font-semibold tracking-tight">{tier.price}</span>
            <span className="text-xs text-muted-foreground">/ {tier.cadence}</span>
          </div>

          <ul className="mt-6 flex-1 space-y-2.5 text-sm">
            {tier.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-ember" />
                <span className="text-foreground/85">{f}</span>
              </li>
            ))}
          </ul>

          {tier.id === "free" ? (
            <Link
              to="/kill"
              search={{ demo: false }}
              className="mt-7 inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-surface/60 px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-foreground/40"
            >
              {tier.cta} <span aria-hidden>→</span>
            </Link>
          ) : (
            <>
              <button
                type="button"
                disabled={loading || !!disabledReason}
                title={disabledReason ?? undefined}
                onClick={() => handleBuy(tier)}
                className={`mt-7 inline-flex items-center justify-center gap-1.5 rounded-full px-5 py-3 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 ${
                  tier.highlight
                    ? "bg-gradient-to-br from-ember to-ember-glow text-background shadow-[0_15px_40px_-15px_var(--ember)]"
                    : "bg-foreground text-background"
                }`}
              >
                {loading ? "Loading…" : tier.cta}
                {tier.highlight ? (
                  <KnifeMark className="h-3.5 w-3.5" />
                ) : (
                  <span aria-hidden>→</span>
                )}
              </button>
              {disabledReason && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Live checkout is disabled until Paddle approval is complete.
                </p>
              )}
            </>
          )}
        </motion.div>
      ))}
    </div>
  );
}
