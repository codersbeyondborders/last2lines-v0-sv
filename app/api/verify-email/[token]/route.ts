import { NextRequest, NextResponse } from "next/server"

// Fluid Compute: DB read + write for token verification.
export const maxDuration = 10
import { query } from "@/lib/db"

/**
 * Legacy magic-link verification route (kept for any outstanding links).
 * The primary verification flow is now inline OTP via /api/send-otp + /api/verify-otp.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const base = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin

  try {
    const { token } = await params

    if (!token) {
      const response = NextResponse.redirect(
        new URL(
          "/verify-email-result?error=1&message=Invalid+verification+link",
          base,
        ),
      )
      response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
      response.headers.set("Pragma", "no-cache")
      return response
    }

    // Find the contribution with this token, join campaign for slug
    const { rows } = await query<{
      id: string
      campaign_slug: string
      email_verified: boolean
    }>(
      `SELECT c.id, camp.slug AS campaign_slug, c.email_verified
         FROM contributions c
         JOIN campaigns camp ON camp.id = c.campaign_id
        WHERE c.verification_token = $1`,
      [token],
    )

    const contribution = rows[0]

    if (!contribution) {
      const response = NextResponse.redirect(
        new URL(
          "/verify-email-result?error=1&message=Verification+link+not+found+or+expired",
          base,
        ),
      )
      response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
      response.headers.set("Pragma", "no-cache")
      return response
    }

    if (contribution.email_verified) {
      const response = NextResponse.redirect(
        new URL(
          `/verify-email-result?message=Email+already+verified&campaignSlug=${contribution.campaign_slug}`,
          base,
        ),
      )
      response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
      response.headers.set("Pragma", "no-cache")
      return response
    }

    // Mark as verified
    await query(
      `UPDATE contributions SET email_verified = true WHERE id = $1`,
      [contribution.id],
    )

    const response = NextResponse.redirect(
      new URL(
        `/verify-email-result?message=Email+verified+successfully&campaignSlug=${contribution.campaign_slug}`,
        base,
      ),
    )
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    return response
  } catch (error) {
    console.error("[v0] Email verification error:", error)
    const response = NextResponse.redirect(
      new URL(
        "/verify-email-result?error=1&message=Failed+to+verify+email",
        base,
      ),
    )
    response.headers.set("Cache-Control", "no-cache, no-store, must-revalidate")
    response.headers.set("Pragma", "no-cache")
    return response
  }
}
