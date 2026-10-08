import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { getLegalName } from "@/lib/settings.functions";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Notice · Kill My Idea" },
      { name: "description", content: "How Kill My Idea collects, uses, and protects your data." },
      { property: "og:title", content: "Privacy Notice · Kill My Idea" },
      {
        property: "og:description",
        content: "How Kill My Idea collects, uses, and protects your data.",
      },
    ],
  }),
  loader: () => getLegalName(),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { legalName } = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="font-display text-4xl font-semibold tracking-tight">Privacy Notice</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: May 25, 2026</p>

        <div className="mt-10 space-y-6 text-sm leading-relaxed text-muted-foreground [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_strong]:text-foreground">
          <p>
            This Privacy Notice explains how <strong>{legalName}</strong>, trading as Kill My Idea
            ("we", "us", "our"), collects, uses, shares, and protects your personal data when you
            use Kill My Idea (the "Service"). We act as the <strong>data controller</strong> for
            personal data processed in connection with your use of the Service.
          </p>

          <h2>1. Data we collect</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Account data:</strong> name, email, hashed login credentials, OAuth
              identifiers.
            </li>
            <li>
              <strong>Content you submit:</strong> startup ideas, context, and any other text you
              enter into the Service.
            </li>
            <li>
              <strong>Generated outputs:</strong> AI-produced analyses linked to your account.
            </li>
            <li>
              <strong>Usage & telemetry:</strong> pages visited, features used, timestamps, basic
              analytics events.
            </li>
            <li>
              <strong>Device & technical data:</strong> IP address, browser type, device
              identifiers, error logs.
            </li>
            <li>
              <strong>Support communications:</strong> messages you send us by email or in-app.
            </li>
            <li>
              <strong>Billing identifiers:</strong> Paddle customer and transaction IDs (full
              payment card details are collected by Paddle, not us).
            </li>
          </ul>

          <h2>2. Why we process it (purposes & legal bases)</h2>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Provide the Service</strong> (account creation, generating analyses, storing
              your history) — performance of contract.
            </li>
            <li>
              <strong>Process payments</strong> through Paddle — performance of contract / legal
              obligation.
            </li>
            <li>
              <strong>Security & fraud prevention</strong> (abuse detection, rate limiting, audit
              logs) — legitimate interests.
            </li>
            <li>
              <strong>Product improvement</strong> (aggregated usage analysis, bug fixes) —
              legitimate interests.
            </li>
            <li>
              <strong>Customer support</strong> — performance of contract / legitimate interests.
            </li>
            <li>
              <strong>Marketing emails</strong> (only if you opt in) — consent, withdrawable at any
              time.
            </li>
            <li>
              <strong>Legal compliance</strong> (tax, accounting, responding to lawful requests) —
              legal obligation.
            </li>
          </ul>

          <h2>3. Who we share data with</h2>
          <p>We share data only with the categories of recipients below, and only as needed:</p>
          <ul className="list-disc space-y-1 pl-6">
            <li>
              <strong>Paddle.com Market Limited</strong> — our Merchant of Record, for payment
              processing, subscription management, invoicing, refunds, and tax compliance.
            </li>
            <li>
              <strong>Infrastructure & hosting providers</strong> (Supabase, Cloudflare) — to run
              our database, authentication, and edge runtime.
            </li>
            <li>
              <strong>AI model providers</strong> (Google via the Lovable AI Gateway) — your
              submitted idea text is sent to generate analyses. We instruct providers not to train
              on your data where contractually available.
            </li>
            <li>
              <strong>Email & support tooling</strong> — for transactional emails and support
              ticketing.
            </li>
            <li>
              <strong>Professional advisers</strong> (legal, accounting) under confidentiality.
            </li>
            <li>
              <strong>Authorities</strong> where we are required to disclose by law, court order, or
              to protect our rights.
            </li>
          </ul>
          <p>
            We do <strong>not</strong> sell your personal data.
          </p>

          <h2>4. International transfers</h2>
          <p>
            Our providers may process data outside the UK/EEA, including in the United States. Where
            required, transfers are protected by appropriate safeguards such as the EU Standard
            Contractual Clauses, the UK International Data Transfer Addendum, or adequacy decisions.
          </p>

          <h2>5. Retention</h2>
          <p>
            We keep account and content data for as long as your account is active. After account
            deletion we remove or anonymise personal data within 90 days, except where we must keep
            records for legal, tax, accounting, or fraud-prevention purposes (typically up to 7
            years for billing records).
          </p>

          <h2>6. Your rights</h2>
          <p>
            Depending on your jurisdiction you have rights to access, rectify, erase, restrict, or
            object to processing of your personal data, to data portability, to withdraw consent,
            and to lodge a complaint with your local supervisory authority. We will respond to
            verified requests within one month. To exercise these rights, email{" "}
            <a href="mailto:privacy@killmyidea.es" className="underline hover:text-foreground">
              privacy@killmyidea.es
            </a>
            .
          </p>

          <h2>7. Security</h2>
          <p>
            We implement appropriate technical and organisational measures including encryption in
            transit (TLS), encryption at rest, row-level security on our database, access controls,
            and audit logging. No system is perfectly secure; please use a strong, unique password.
          </p>

          <h2>8. Cookies</h2>
          <p>
            We use a minimal set of cookies and similar storage strictly necessary to operate the
            Service (authentication session, language preference). We do not use third-party
            advertising cookies. If we add analytics cookies in the future we will request consent
            first.
          </p>

          <h2>9. Children</h2>
          <p>
            The Service is not directed at children under 16, and we do not knowingly collect
            personal data from them. If you believe a child has provided us with personal data,
            contact us and we will delete it.
          </p>

          <h2>10. Changes</h2>
          <p>
            We may update this Notice from time to time. Material changes will be posted on this
            page with a new "Last updated" date.
          </p>

          <h2>11. Contact</h2>
          <p>
            <strong>Data controller:</strong> {legalName}, trading as Kill My Idea. For privacy
            questions or to exercise your rights, contact{" "}
            <a href="mailto:privacy@killmyidea.es" className="underline hover:text-foreground">
              privacy@killmyidea.es
            </a>
            .
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
