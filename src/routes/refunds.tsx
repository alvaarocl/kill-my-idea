import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getLegalName } from "@/lib/settings.functions";

export const Route = createFileRoute("/refunds")({
  head: () => ({
    meta: [
      { title: "Refund Policy · Kill My Idea" },
      {
        name: "description",
        content: "Our 30-day money-back guarantee and how to request a refund.",
      },
      { property: "og:title", content: "Refund Policy · Kill My Idea" },
      {
        property: "og:description",
        content: "Our 30-day money-back guarantee and how to request a refund.",
      },
    ],
  }),
  loader: () => getLegalName(),
  component: RefundsPage,
});

function RefundsPage() {
  const { legalName } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Refund Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 25, 2026</p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_strong]:text-foreground">
          <h2>30-day money-back guarantee</h2>
          <p>
            We offer a <strong>30-day money-back guarantee</strong> on all purchases — both single
            reports and subscription plans. If you are not satisfied with Kill My Idea, you can
            request a full refund within 30 days of your order date, no questions asked.
          </p>

          <h2>How to request a refund</h2>
          <p>
            All payments are processed by our Merchant of Record, <strong>Paddle</strong>. To
            request a refund:
          </p>
          <ol className="list-decimal space-y-2 pl-6">
            <li>
              Go to{" "}
              <a
                href="https://paddle.net"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-foreground"
              >
                paddle.net
              </a>{" "}
              and look up your order using the email address you paid with.
            </li>
            <li>Click the order and choose "Request refund".</li>
            <li>
              Alternatively, email us at{" "}
              <a href="mailto:support@killmyidea.es" className="underline hover:text-foreground">
                support@killmyidea.es
              </a>{" "}
              with your order ID and we will process the refund on your behalf.
            </li>
          </ol>

          <h2>Subscriptions</h2>
          <p>
            You can cancel a subscription at any time from the Paddle customer portal. Cancellation
            stops future renewals; you retain access until the end of the current billing period. If
            you cancel within the first 30 days of a new subscription, you can also request a full
            refund using the steps above.
          </p>

          <h2>Processing time</h2>
          <p>
            Refunds are usually processed within 5–10 business days back to the original payment
            method, depending on your bank or card issuer.
          </p>

          <h2>Statutory rights</h2>
          <p>
            This policy is in addition to any statutory consumer rights you have under your local
            law (for example, the right of withdrawal under EU consumer protection rules). Nothing
            in this policy limits those rights.
          </p>

          <h2>Contact</h2>
          <p>
            Operated by <strong>{legalName}</strong>, trading as Kill My Idea. Questions about a
            refund? Email{" "}
            <a href="mailto:support@killmyidea.es" className="underline hover:text-foreground">
              support@killmyidea.es
            </a>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
