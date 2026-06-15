import { type NextRequest, NextResponse } from "next/server"
import { createHash, randomInt } from "crypto"
import { nanoid } from "nanoid"
import { query } from "@/lib/db"

const RESEND_API_KEY = process.env.RESEND_API_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

export async function POST(request: NextRequest) {
  try {
    const { email, campaignId, campaignTitle } = await request.json()

    if (!email || !campaignId || !campaignTitle) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!RESEND_API_KEY) {
      console.error("[v0] RESEND_API_KEY not configured")
      return NextResponse.json({ error: "Email service not configured" }, { status: 500 })
    }

    // Confirm campaign exists
    const { rows: campaignRows } = await query<{ id: string }>(
      `SELECT id FROM campaigns WHERE id = $1`,
      [campaignId],
    )
    if (!campaignRows[0]) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Invalidate existing unused OTPs for this email+campaign pair
    await query(
      `UPDATE email_otps SET used = true
         WHERE email = $1 AND campaign_id = $2 AND used = false`,
      [email.toLowerCase().trim(), campaignId],
    )

    // Generate a 6-digit code
    const code = String(randomInt(100000, 999999))
    const codeHash = createHash("sha256").update(code).digest("hex")
    const id = `otp_${nanoid(12)}`

    await query(
      `INSERT INTO email_otps (id, email, campaign_id, code_hash, expires_at)
       VALUES ($1, $2, $3, $4, now() + interval '15 minutes')`,
      [id, email.toLowerCase().trim(), campaignId, codeHash],
    )

    // Send the code via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "noreply@last2lines.org",
        to: email,
        subject: `Your verification code for "${campaignTitle}"`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
            <h2 style="color:#1f6f54;">Verify your email</h2>
            <p>Use the code below to verify your email address for <strong>${campaignTitle}</strong>.</p>
            <div style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#111;margin:24px 0;">
              ${code}
            </div>
            <p style="color:#555;">This code expires in 15&nbsp;minutes.</p>
            <p style="color:#999;font-size:12px;margin-top:24px;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error("[v0] Resend API error (send-otp):", err)
      return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[v0] send-otp error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
