import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getLegalName } from "@/lib/settings.functions";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service · Kill My Idea" },
      { name: "description", content: "The terms governing your use of Kill My Idea." },
      { property: "og:title", content: "Terms of Service · Kill My Idea" },
      { property: "og:description", content: "The terms governing your use of Kill My Idea." },
    ],
  }),
  loader: () => getLegalName(),
  component: TermsPage,
});

function TermsPage() {
  const { legalName } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 25, 2026</p>

        <div className="prose prose-invert mt-10 max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_strong]:text-foreground">
          <p>
            These Terms of Service ("Terms") govern your access to and use of Kill My Idea (the
            "Service"), operated by <strong>{legalName}</strong> ("we", "us", "our"), trading as
            Kill My Idea. By creating an account or using the Service, you agree to be bound by
            these Terms.
          </p>

          <h2>1. The Service</h2>
          <p>
            Kill My Idea generates AI-powered written analyses ("autopsies") of startup ideas you
            submit. Outputs are produced by third-party large language models and are for general
            informational and educational purposes only. They are not professional, legal,
            financial, or investment advice.
          </p>

          <h2>2. Eligibility & Account</h2>
          <p>
            You must be of legal age in your jurisdiction and have authority to bind any
            organization you represent. You are responsible for keeping your credentials
            confidential and for all activity under your account, and for providing accurate
            information.
          </p>

          <h2>3. Acceptable Use</h2>
          <p>You must not, and must not allow others to:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>use the Service unlawfully or for fraud, spam, or abuse;</li>
            <li>infringe intellectual property or privacy rights of others;</li>
            <li>
              probe, scan, scrape, or interfere with the security or integrity of the Service;
            </li>
            <li>
              upload malware or attempt to bypass technical limits, rate limits, or access controls;
            </li>
            <li>
              submit content that is illegal, hateful, sexually explicit involving minors, or that
              promotes violence;
            </li>
            <li>
              use outputs to make automated decisions in regulated domains (medical, legal,
              financial) without qualified human oversight;
            </li>
            <li>resell, redistribute, or use outputs to train competing AI models;</li>
            <li>reverse engineer, decompile, or attempt to derive source code of the Service.</li>
          </ul>

          <h2>4. AI Outputs & Accuracy</h2>
          <p>
            Outputs may be inaccurate, incomplete, biased, or out of date. You are responsible for
            your prompts, for verifying outputs before relying on them, and for ensuring you have
            the rights to any input content you submit. We may filter, restrict, or refuse outputs,
            and may remove content or suspend accounts for repeated or serious policy violations. If
            you believe content infringes your rights, contact us and we will review and act in line
            with applicable law.
          </p>

          <h2>5. Intellectual Property</h2>
          <p>
            We retain all rights, title, and interest in the Service, including software, models,
            prompts, branding, and documentation. Subject to these Terms, we grant you a limited,
            non-exclusive, non-transferable, revocable license to use the Service for your internal
            business or personal evaluation purposes. As between you and us, you retain rights to
            your inputs; you grant us a worldwide license to host, process, and display them solely
            to provide and improve the Service.
          </p>

          <h2>6. Payment, Subscriptions & Taxes</h2>
          <p>
            Paid plans and one-time purchases are sold by <strong>Paddle.com Market Limited</strong>{" "}
            as our Merchant of Record. Payment, billing, currency conversion, taxes, invoicing, and
            refund mechanics are governed by Paddle's{" "}
            <a
              href="https://www.paddle.com/legal/checkout-buyer-terms"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground"
            >
              Buyer Terms
            </a>
            . Subscriptions renew automatically until canceled. You may cancel at any time from the
            customer portal; cancellation takes effect at the end of the current billing period.
          </p>
          <p>
            <strong>Merchant of Record disclosure:</strong> Our order process is conducted by our
            online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders.
            Paddle provides all customer service inquiries and handles returns.
          </p>

          <h2>7. Service Availability</h2>
          <p>
            We provide the Service "as is" and "as available". We do not warrant uninterrupted,
            timely, secure, or error-free operation, and disclaim all implied warranties including
            merchantability, fitness for a particular purpose, and non-infringement, to the fullest
            extent permitted by law.
          </p>

          <h2>8. Suspension & Termination</h2>
          <p>
            We may suspend or terminate your access for: material breach of these Terms,
            non-payment, security or fraud risk, or repeated or serious policy violations. You may
            stop using the Service at any time. On termination, your right to use the Service ends;
            we may delete your data after a reasonable period unless we are legally required to
            retain it.
          </p>

          <h2>9. Liability</h2>
          <p>
            To the maximum extent permitted by law, our aggregate liability arising out of or
            related to the Service is limited to the fees you paid us in the twelve (12) months
            before the event giving rise to the claim. We are not liable for indirect, incidental,
            consequential, special, or punitive damages, or for lost profits, data, or goodwill.
            Nothing in these Terms excludes liability that cannot be excluded by law (e.g. fraud,
            death, or personal injury caused by negligence).
          </p>

          <h2>10. Indemnification</h2>
          <p>
            You will defend and indemnify us against claims arising from your inputs, your unlawful
            use of the Service, or your breach of these Terms.
          </p>

          <h2>11. Changes</h2>
          <p>
            We may update these Terms from time to time. Material changes will be posted on this
            page with a new "Last updated" date. Continued use after the effective date constitutes
            acceptance.
          </p>

          <h2>12. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the jurisdiction of our registered address,
            without regard to conflict of laws rules. You agree to the exclusive jurisdiction of the
            courts located there, subject to mandatory consumer protection rights in your country of
            residence.
          </p>

          <h2>13. Contact</h2>
          <p>
            Questions about these Terms? Contact us at{" "}
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
