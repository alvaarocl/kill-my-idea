/**
 * Minimal Resend email helper compatible with Cloudflare Workers (no Node-specific APIs).
 * Uses fetch directly — no Resend SDK needed.
 *
 * Set RESEND_API_KEY in env vars (Cloudflare secrets for prod, .env for dev).
 * Set RESEND_FROM to a sender address on your verified domain, e.g. "Kill My Idea <hello@killmyidea.es>".
 * If either is missing, sendEmail() is a no-op and logs a warning.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM ?? "Kill My Idea <hello@killmyidea.es>";

  if (!apiKey) {
    console.warn("sendEmail: RESEND_API_KEY not set — skipping email to", payload.to);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("sendEmail: Resend API error", res.status, body);
  }
}
