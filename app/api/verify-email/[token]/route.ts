import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/db"

/**
 * Verify email token and mark contribution as email_verified.
 * Called when user clicks the verification link in their email.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.redirect(
        new URL("/error?message=Invalid verification link", request.url),
      )
    }

    // Find the contribution with this token
    const { rows } = await query<{
      id: string
      campaign_id: string
      email_verified: boolean
    }>(
      `SELECT id, campaign_id, email_verified
         FROM contributions
        WHERE verification_token = $1`,
      [token],
    )

    const contribution = rows[0]

    if (!contribution) {
      return NextResponse.redirect(
        new URL("/error?message=Verification link not found or expired", request.url),
      )
    }

    if (contribution.email_verified) {
      return NextResponse.redirect(
        new URL("/success?message=Email already verified", request.url),
      )
    }

    // Mark as verified
    await query(
      `UPDATE contributions
         SET email_verified = true
       WHERE id = $1`,
      [contribution.id],
    )

    return NextResponse.redirect(
      new URL(
        `/success?message=Email verified successfully&campaignId=${contribution.campaign_id}`,
        request.url,
      ),
    )
  } catch (error) {
    console.error("[v0] Email verification error:", error)
    return NextResponse.redirect(
      new URL("/error?message=Failed to verify email", request.url),
    )
  }
}
