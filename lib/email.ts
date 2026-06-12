import "server-only"
import { Resend } from "resend"

// ----------------------------------------------------------------------------
// Resend email helper.
//
// Configuration (all optional — the app degrades gracefully without them):
//   RESEND_API_KEY   — your Resend API key. If absent, emails are skipped
//                      (logged) so local/dev flows keep working.
//   RESEND_FROM_EMAIL — verified sender, e.g. "Last2Lines <hello@yourdomain>".
//                       Falls back to Resend's onboarding test sender.
//   NEXT_PUBLIC_SITE_URL — absolute base URL used to build links in emails.
// ----------------------------------------------------------------------------

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "Last2Lines <onboarding@resend.dev>"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

/** True when Resend is configured and able to actually send mail. */
export function isEmailConfigured(): boolean {
  return resend !== null
}

/** Resolve the public base URL for links embedded in emails. */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/$/, "")
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return "http://localhost:3000"
}

interface SendResult {
  ok: boolean
  skipped?: boolean
  error?: string
}

async function send(opts: {
  to: string
  subject: string
  html: string
}): Promise<SendResult> {
  if (!resend) {
    // No API key configured — skip silently so submissions still succeed.
    console.log(
      `[v0] Email skipped (RESEND_API_KEY not set): "${opts.subject}" to ${opts.to}`,
    )
    return { ok: true, skipped: true }
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    })
    if (error) {
      console.log("[v0] Resend send error:", error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (err) {
    console.log("[v0] Resend send threw:", err)
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Unknown email error",
    }
  }
}

// ----------------------------------------------------------------------------
// Shared layout
// ----------------------------------------------------------------------------

function layout(opts: { heading: string; body: string; cta?: { label: string; href: string } }) {
  const ctaHtml = opts.cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
         <tr><td style="border-radius:8px;background:#1f6f54;">
           <a href="${opts.cta.href}"
              style="display:inline-block;padding:12px 24px;font-family:Helvetica,Arial,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">
             ${opts.cta.label}
           </a>
         </td></tr>
       </table>`
    : ""

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f1;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f1;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:14px;border:1px solid #e6e6e1;overflow:hidden;">
          <tr><td style="padding:28px 32px 8px;">
            <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#1f6f54;">Last2Lines</p>
          </td></tr>
          <tr><td style="padding:8px 32px 32px;">
            <h1 style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.3;color:#1a1a1a;">${opts.heading}</h1>
            <div style="font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#444444;">${opts.body}</div>
            ${ctaHtml}
            <p style="margin:24px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:#999999;">If you didn't write to this poem, you can safely ignore this email.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`
}

// ----------------------------------------------------------------------------
// Public senders
// ----------------------------------------------------------------------------

/** Email a confirmation link so the author can verify their submission. */
export async function sendVerificationEmail(opts: {
  to: string
  name: string | null
  campaignTitle: string
  verifyUrl: string
}): Promise<SendResult> {
  const greeting = opts.name ? `Hi ${escapeHtml(opts.name)},` : "Hello,"
  return send({
    to: opts.to,
    subject: `Confirm your couplet for "${opts.campaignTitle}"`,
    html: layout({
      heading: "Confirm your two lines",
      body: `<p style="margin:0 0 12px;">${greeting}</p>
             <p style="margin:0 0 12px;">Thanks for adding your couplet to <strong>${escapeHtml(
               opts.campaignTitle,
             )}</strong>. To make sure it's really you, please confirm your email address. Your lines won't be reviewed or published until you do.</p>`,
      cta: { label: "Confirm my submission", href: opts.verifyUrl },
    }),
  })
}

/** Email the author to let them know their couplet is now live in the poem. */
export async function sendPublishedEmail(opts: {
  to: string
  name: string | null
  campaignTitle: string
  poemUrl: string
}): Promise<SendResult> {
  const greeting = opts.name ? `Hi ${escapeHtml(opts.name)},` : "Hello,"
  return send({
    to: opts.to,
    subject: `Your couplet is live in "${opts.campaignTitle}"`,
    html: layout({
      heading: "Your lines are now part of the poem",
      body: `<p style="margin:0 0 12px;">${greeting}</p>
             <p style="margin:0 0 12px;">Wonderful news — your couplet has been published and stitched into the living poem for <strong>${escapeHtml(
               opts.campaignTitle,
             )}</strong>. Thank you for adding your voice.</p>`,
      cta: { label: "Read the poem", href: opts.poemUrl },
    }),
  })
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
