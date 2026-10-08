import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PricingGrid } from "@/components/pricing-section";

const ease = [0.22, 1, 0.36, 1] as const;

function PricingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <SiteHeader />

      <section className="relative px-5 pb-16 pt-16 sm:pt-24">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-ember/15 blur-[140px]" />
        </div>

        <div className="mx-auto max-w-3xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="font-mono text-xs uppercase tracking-[0.22em] text-ember"
          >
            / Pricing
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="mt-3 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl"
          >
            Pay for the truth. <span className="text-gradient-ember">Skip the hopium</span>.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
            className="mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg"
          >
            Start free. Upgrade only when an idea is worth defending.
          </motion.p>
        </div>
      </section>

      <section className="px-5 pb-32">
        <div className="mx-auto max-w-6xl">
          <PricingGrid compact />
          <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-muted-foreground">
            All prices in EUR. VAT handled automatically. Payments processed by Paddle as Merchant
            of Record. Cancel anytime from the customer portal.
          </p>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Kill My Idea" },
      {
        name: "description",
        content:
          "Pay €5 for a single brutal autopsy, or go Founder (€19/mo) for 20 ideas a month. No hopium, no fluff.",
      },
      { property: "og:title", content: "Pricing — Kill My Idea" },
      {
        property: "og:description",
        content: "Pay €5 for a single brutal autopsy, or go Founder (€19/mo) for 20 ideas a month.",
      },
    ],
  }),
  component: PricingPage,
});
