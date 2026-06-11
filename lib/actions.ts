"use server"

import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"
import { query, withConnection } from "@/lib/db"
import { createClient } from "@/lib/supabase/server"
import type { Contribution } from "@/lib/mock-data"

const VERSE_MAX = 100
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface SubmitResult {
  ok: boolean
  error?: string
}

/**
 * Public action: a visitor submits a two-line couplet to a campaign.
 * Creates/links an author, then inserts a pending contribution.
 * No auth required — but server-side validation is enforced.
 */
export async function submitContribution(input: {
  campaignId: string
  fullName: string
  email: string
  country?: string | null
  lineOne: string
  lineTwo: string
  consent: boolean
}): Promise<SubmitResult> {
  const fullName = input.fullName?.trim()
  const email = input.email?.trim().toLowerCase()
  const lineOne = input.lineOne?.trim()
  const lineTwo = input.lineTwo?.trim()

  // Server-side validation (never trust the client).
  if (!fullName) return { ok: false, error: "Please provide your name." }
  if (!email || !EMAIL_RE.test(email))
    return { ok: false, error: "Please provide a valid email address." }
  if (!lineOne || !lineTwo)
    return { ok: false, error: "Both lines are required." }
  if (lineOne.length > VERSE_MAX || lineTwo.length > VERSE_MAX)
    return { ok: false, error: `Each line must be under ${VERSE_MAX} characters.` }
  if (!input.consent)
    return { ok: false, error: "Please accept the terms to continue." }

  // Confirm the campaign exists and is currently open.
  const { rows: campaignRows } = await query<{
    id: string
    slug: string
    status: string
    start_date: Date
    close_date: Date
  }>(
    `SELECT id, slug, status, start_date, close_date FROM campaigns WHERE id = $1`,
    [input.campaignId],
  )
  const campaign = campaignRows[0]
  if (!campaign) return { ok: false, error: "Campaign not found." }

  const now = Date.now()
  const open =
    campaign.status === "active" &&
    now >= new Date(campaign.start_date).getTime() &&
    now <= new Date(campaign.close_date).getTime()
  if (!open)
    return { ok: false, error: "This campaign is not currently accepting submissions." }

  try {
    await withConnection(async (client) => {
      // Upsert the author by email.
      const authorId = `aut_${nanoid(12)}`
      const { rows: authorRows } = await client.query<{
        id: string
        status: string
      }>(
        `INSERT INTO authors (id, name, email, country, status)
         VALUES ($1, $2, $3, $4, 'active')
         ON CONFLICT (email) DO UPDATE
           SET name = COALESCE(EXCLUDED.name, authors.name),
               country = COALESCE(EXCLUDED.country, authors.country)
         RETURNING id, status`,
        [authorId, fullName, email, input.country ?? null],
      )
      const author = authorRows[0]
      if (author.status === "banned") {
        throw new Error("banned")
      }

      await client.query(
        `INSERT INTO contributions
           (id, campaign_id, sequence_number, line_one, line_two, author_id, status)
         VALUES ($1, $2, 0, $3, $4, $5, 'pending')`,
        [`ctr_${nanoid(12)}`, input.campaignId, lineOne, lineTwo, author.id],
      )
    })
  } catch (err) {
    if (err instanceof Error && err.message === "banned") {
      return {
        ok: false,
        error: "This account is not permitted to submit contributions.",
      }
    }
    console.log("[v0] submitContribution error:", err)
    return {
      ok: false,
      error: "Something went wrong while saving your lines. Please try again.",
    }
  }

  revalidatePath(`/campaign/${campaign.slug}`)
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/contributions")
  return { ok: true }
}

// ----------------------------------------------------------------------------
// Admin-only actions (require an authenticated Supabase session).
// ----------------------------------------------------------------------------

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  return user
}

/**
 * Moderate a contribution. Approving assigns the next sequence number within
 * the campaign so the poem stays correctly ordered.
 */
export async function moderateContribution(input: {
  id: string
  status: Contribution["status"]
  reason?: string | null
}): Promise<SubmitResult> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: "You must be signed in to moderate." }
  }

  try {
    await withConnection(async (client) => {
      const { rows } = await client.query<{ campaign_id: string }>(
        `SELECT campaign_id FROM contributions WHERE id = $1`,
        [input.id],
      )
      const campaignId = rows[0]?.campaign_id
      if (!campaignId) throw new Error("not found")

      if (input.status === "approved") {
        // Assign the next sequence number for this campaign's poem.
        await client.query(
          `UPDATE contributions
             SET status = 'approved',
                 moderation_reason = $2,
                 sequence_number = COALESCE(
                   (SELECT MAX(sequence_number) FROM contributions
                     WHERE campaign_id = $3 AND status = 'approved'), 0) + 1
           WHERE id = $1`,
          [input.id, input.reason ?? null, campaignId],
        )
      } else {
        // Rejecting or requeuing drops it out of the ordered poem.
        await client.query(
          `UPDATE contributions
             SET status = $2, moderation_reason = $3, sequence_number = 0
           WHERE id = $1`,
          [input.id, input.status, input.reason ?? null],
        )
      }
    })
  } catch (err) {
    console.log("[v0] moderateContribution error:", err)
    return { ok: false, error: "Could not update this contribution." }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/contributions")
  return { ok: true }
}

/** Toggle an author's banned/active status. */
export async function setAuthorStatus(input: {
  id: string
  status: "active" | "banned"
}): Promise<SubmitResult> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: "You must be signed in." }
  }

  try {
    await query(`UPDATE authors SET status = $2 WHERE id = $1`, [
      input.id,
      input.status,
    ])
  } catch (err) {
    console.log("[v0] setAuthorStatus error:", err)
    return { ok: false, error: "Could not update this author." }
  }

  revalidatePath("/dashboard/authors")
  return { ok: true }
}

/** Update per-campaign moderation settings. */
export async function updateModerationSettings(input: {
  campaignId: string
  level: "lenient" | "standard" | "strict"
  profanityFilter: boolean
  enforceTheme: boolean
  confidenceThreshold: number
}): Promise<SubmitResult> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: "You must be signed in." }
  }

  try {
    await query(
      `INSERT INTO moderation_settings
         (id, campaign_id, level, profanity_filter, enforce_theme, confidence_threshold, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       ON CONFLICT (campaign_id) DO UPDATE
         SET level = EXCLUDED.level,
             profanity_filter = EXCLUDED.profanity_filter,
             enforce_theme = EXCLUDED.enforce_theme,
             confidence_threshold = EXCLUDED.confidence_threshold,
             updated_at = now()`,
      [
        `mds_${nanoid(10)}`,
        input.campaignId,
        input.level,
        input.profanityFilter,
        input.enforceTheme,
        input.confidenceThreshold,
      ],
    )
  } catch (err) {
    console.log("[v0] updateModerationSettings error:", err)
    return { ok: false, error: "Could not save settings." }
  }

  revalidatePath("/dashboard/settings")
  return { ok: true }
}

/** Edit the two lines of a contribution without changing author or status. */
export async function editContribution(input: {
  id: string
  lineOne: string
  lineTwo: string
}): Promise<SubmitResult> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: "You must be signed in." }
  }

  const lineOne = input.lineOne?.trim()
  const lineTwo = input.lineTwo?.trim()
  if (!lineOne || !lineTwo)
    return { ok: false, error: "Both lines are required." }
  if (lineOne.length > VERSE_MAX || lineTwo.length > VERSE_MAX)
    return { ok: false, error: `Each line must be under ${VERSE_MAX} characters.` }

  try {
    await query(
      `UPDATE contributions SET line_one = $2, line_two = $3 WHERE id = $1`,
      [input.id, lineOne, lineTwo],
    )
  } catch (err) {
    console.log("[v0] editContribution error:", err)
    return { ok: false, error: "Could not save your edits." }
  }

  revalidatePath("/dashboard/contributions")
  return { ok: true }
}

/** Permanently delete a contribution. */
export async function deleteContribution(id: string): Promise<SubmitResult> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: "You must be signed in." }
  }

  try {
    await query(`DELETE FROM contributions WHERE id = $1`, [id])
  } catch (err) {
    console.log("[v0] deleteContribution error:", err)
    return { ok: false, error: "Could not delete this contribution." }
  }

  revalidatePath("/dashboard/contributions")
  revalidatePath("/dashboard")
  return { ok: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
