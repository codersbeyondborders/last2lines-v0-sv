"use server"

import { revalidatePath } from "next/cache"
import { nanoid } from "nanoid"
import { query, withConnection } from "@/lib/db"
import { createClient } from "@/lib/supabase/server"
import { moderateCouplet } from "@/lib/ai-moderation"
import {
  getSiteUrl,
  sendVerificationEmail,
  sendPublishedEmail,
} from "@/lib/email"
import type { Contribution } from "@/lib/mock-data"

const VERSE_MAX = 100
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Shape of the campaign fields needed to moderate + route a submission. */
interface CampaignModerationContext {
  id: string
  slug: string
  title: string
  theme: string
  description: string
  ai_moderation: boolean
  ai_level: "lenient" | "standard" | "strict"
}

interface ModerationOutcome {
  status: Contribution["status"]
  reason: string | null
  lineOne: string
  lineTwo: string
}

/**
 * Run AI auto-moderation (when enabled) and resolve the final status + lines.
 *
 * Decision outcomes:
 *   publish → approved as submitted
 *   curate  → approved with AI-rewritten lines
 *   manual  → pending for a human moderator
 *
 * Any AI failure (or AI disabled) falls back to manual (pending).
 */
async function runModeration(
  campaign: CampaignModerationContext,
  lineOne: string,
  lineTwo: string,
): Promise<ModerationOutcome> {
  if (!campaign.ai_moderation) {
    return { status: "pending", reason: null, lineOne, lineTwo }
  }

  // Fetch the last two approved couplets to give the AI poem context.
  const { rows: prevRows } = await query<{
    line_one: string
    line_two: string
  }>(
    `SELECT line_one, line_two
       FROM contributions
      WHERE campaign_id = $1 AND status = 'approved'
      ORDER BY sequence_number DESC
      LIMIT 2`,
    [campaign.id],
  )
  const previousCouplets = prevRows
    .reverse()
    .map((r) => ({ lineOne: r.line_one, lineTwo: r.line_two }))

  const verdict = await moderateCouplet({
    lineOne,
    lineTwo,
    level: campaign.ai_level,
    campaignTitle: campaign.title,
    campaignTheme: campaign.theme,
    campaignDescription: campaign.description,
    previousCouplets,
  })

  if (verdict.decision === "publish") {
    return {
      status: "approved",
      reason: `AI (${campaign.ai_level}): ${verdict.reason}`,
      lineOne,
      lineTwo,
    }
  }
  if (verdict.decision === "curate") {
    return {
      status: "approved",
      reason: `AI curated (${campaign.ai_level}): ${verdict.reason}`,
      lineOne: verdict.curatedLineOne ?? lineOne,
      lineTwo: verdict.curatedLineTwo ?? lineTwo,
    }
  }
  return {
    status: "pending",
    reason: verdict.fallback
      ? `AI unavailable: ${verdict.reason}`
      : `AI flagged for manual review (${campaign.ai_level}): ${verdict.reason}`,
    lineOne,
    lineTwo,
  }
}

export interface SubmitResult {
  ok: boolean
  error?: string
  /** Resulting moderation status of a public submission, when applicable. */
  status?: Contribution["status"]
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
    title: string
    theme: string
    description: string
    ai_moderation: boolean
    ai_level: "lenient" | "standard" | "strict"
    require_email_verification: boolean
    auto_email_on_publish: boolean
  }>(
    `SELECT id, slug, status, start_date, close_date, title, theme, description,
            ai_moderation, ai_level, require_email_verification, auto_email_on_publish
       FROM campaigns WHERE id = $1`,
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

  // When email verification is required, hold the submission as "unverified"
  // and skip moderation until the author confirms via the emailed link.
  // Otherwise, moderate immediately.
  let initialStatus: Contribution["status"]
  let moderationReason: string | null
  let finalLineOne = lineOne
  let finalLineTwo = lineTwo
  let verificationToken: string | null = null

  if (campaign.require_email_verification) {
    initialStatus = "unverified"
    moderationReason = null
    verificationToken = nanoid(32)
  } else {
    const outcome = await runModeration(campaign, lineOne, lineTwo)
    initialStatus = outcome.status
    moderationReason = outcome.reason
    finalLineOne = outcome.lineOne
    finalLineTwo = outcome.lineTwo
  }

  let createdContributionId: string | null = null

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

      const contributionId = `ctr_${nanoid(12)}`
      createdContributionId = contributionId

      if (initialStatus === "approved") {
        // Approved submissions (publish or curate) get the next sequence number.
        await client.query(
          `INSERT INTO contributions
             (id, campaign_id, sequence_number, line_one, line_two, author_id,
              status, moderation_reason, email_verified)
           VALUES ($1, $2,
             COALESCE((SELECT MAX(sequence_number) FROM contributions
                        WHERE campaign_id = $2 AND status = 'approved'), 0) + 1,
             $3, $4, $5, 'approved', $6, true)`,
          [
            contributionId,
            input.campaignId,
            finalLineOne,
            finalLineTwo,
            author.id,
            moderationReason,
          ],
        )
      } else if (initialStatus === "unverified") {
        // Held until the author confirms their email.
        await client.query(
          `INSERT INTO contributions
             (id, campaign_id, sequence_number, line_one, line_two, author_id,
              status, moderation_reason, verification_token, verification_sent_at)
           VALUES ($1, $2, 0, $3, $4, $5, 'unverified', NULL, $6, now())`,
          [
            contributionId,
            input.campaignId,
            finalLineOne,
            finalLineTwo,
            author.id,
            verificationToken,
          ],
        )
      } else {
        // pending — queued for manual moderation.
        await client.query(
          `INSERT INTO contributions
             (id, campaign_id, sequence_number, line_one, line_two, author_id,
              status, moderation_reason)
           VALUES ($1, $2, 0, $3, $4, $5, $6, $7)`,
          [
            contributionId,
            input.campaignId,
            finalLineOne,
            finalLineTwo,
            author.id,
            initialStatus,
            moderationReason,
          ],
        )
      }
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

  // Side effects after the row is committed.
  if (initialStatus === "unverified" && verificationToken) {
    // Send the verification link. If email is unconfigured it's a no-op.
    const verifyUrl = `${getSiteUrl()}/verify/${verificationToken}`
    await sendVerificationEmail({
      to: email,
      name: fullName,
      campaignTitle: campaign.title,
      verifyUrl,
    })
  } else if (
    initialStatus === "approved" &&
    campaign.auto_email_on_publish &&
    createdContributionId
  ) {
    // Auto-notify the author that their couplet is live.
    await sendPublishedEmail({
      to: email,
      name: fullName,
      campaignTitle: campaign.title,
      poemUrl: `${getSiteUrl()}/campaign/${campaign.slug}#poem`,
    })
    await query(
      `UPDATE contributions SET publish_email_sent_at = now() WHERE id = $1`,
      [createdContributionId],
    )
  }

  revalidatePath(`/campaign/${campaign.slug}`)
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/contributions")
  return { ok: true, status: initialStatus }
}

// ----------------------------------------------------------------------------
// Public: verify a submission via the emailed token.
// ----------------------------------------------------------------------------

export interface VerifyResult {
  ok: boolean
  error?: string
  /** Status the contribution landed in after verification + moderation. */
  status?: Contribution["status"]
  campaignSlug?: string
  campaignTitle?: string
}

/**
 * Confirm a contribution's email via its verification token. On success the
 * couplet proceeds to moderation (the step that was deferred at submit time).
 * Idempotent: re-visiting an already-verified link reports the current status.
 */
export async function verifyContribution(
  token: string,
): Promise<VerifyResult> {
  if (!token) return { ok: false, error: "Missing verification token." }

  // Locate the contribution + its campaign moderation context.
  const { rows } = await query<{
    id: string
    status: Contribution["status"]
    line_one: string
    line_two: string
    author_id: string
    email_verified: boolean
    author_email: string
    author_name: string | null
    campaign_id: string
    slug: string
    title: string
    theme: string
    description: string
    ai_moderation: boolean
    ai_level: "lenient" | "standard" | "strict"
    auto_email_on_publish: boolean
  }>(
    `SELECT c.id, c.status, c.line_one, c.line_two, c.author_id, c.email_verified,
            a.email AS author_email, a.name AS author_name,
            cm.id AS campaign_id, cm.slug, cm.title, cm.theme, cm.description,
            cm.ai_moderation, cm.ai_level, cm.auto_email_on_publish
       FROM contributions c
       JOIN authors a ON a.id = c.author_id
       JOIN campaigns cm ON cm.id = c.campaign_id
      WHERE c.verification_token = $1
      LIMIT 1`,
    [token],
  )
  const row = rows[0]
  if (!row) return { ok: false, error: "This verification link is invalid or has expired." }

  // Already verified — report the current state without re-processing.
  if (row.email_verified || row.status !== "unverified") {
    return {
      ok: true,
      status: row.status === "unverified" ? "pending" : row.status,
      campaignSlug: row.slug,
      campaignTitle: row.title,
    }
  }

  // Now run the moderation that was deferred until verification.
  const outcome = await runModeration(
    {
      id: row.campaign_id,
      slug: row.slug,
      title: row.title,
      theme: row.theme,
      description: row.description,
      ai_moderation: row.ai_moderation,
      ai_level: row.ai_level,
    },
    row.line_one,
    row.line_two,
  )

  try {
    if (outcome.status === "approved") {
      await query(
        `UPDATE contributions
           SET status = 'approved',
               email_verified = true,
               verification_token = NULL,
               moderation_reason = $2,
               line_one = $3,
               line_two = $4,
               sequence_number = COALESCE(
                 (SELECT MAX(sequence_number) FROM contributions
                   WHERE campaign_id = $5 AND status = 'approved'), 0) + 1
         WHERE id = $1`,
        [row.id, outcome.reason, outcome.lineOne, outcome.lineTwo, row.campaign_id],
      )
    } else {
      await query(
        `UPDATE contributions
           SET status = $2,
               email_verified = true,
               verification_token = NULL,
               moderation_reason = $3,
               line_one = $4,
               line_two = $5
         WHERE id = $1`,
        [row.id, outcome.status, outcome.reason, outcome.lineOne, outcome.lineTwo],
      )
    }
  } catch (err) {
    console.log("[v0] verifyContribution error:", err)
    return { ok: false, error: "Could not verify your submission. Please try again." }
  }

  // Auto-email on publish, when enabled and the couplet went live.
  if (outcome.status === "approved" && row.auto_email_on_publish) {
    await sendPublishedEmail({
      to: row.author_email,
      name: row.author_name,
      campaignTitle: row.title,
      poemUrl: `${getSiteUrl()}/campaign/${row.slug}#poem`,
    })
    await query(
      `UPDATE contributions SET publish_email_sent_at = now() WHERE id = $1`,
      [row.id],
    )
  }

  revalidatePath(`/campaign/${row.slug}`)
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/contributions")
  return {
    ok: true,
    status: outcome.status,
    campaignSlug: row.slug,
    campaignTitle: row.title,
  }
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

  // Capture details needed to optionally email the author on approval.
  interface PublishEmailContext {
    contributionId: string
    email: string
    name: string | null
    slug: string
    title: string
    alreadySent: boolean
  }
  let emailContext: PublishEmailContext | null = null

  try {
    await withConnection(async (client) => {
      const { rows } = await client.query<{
        campaign_id: string
        author_email: string
        author_name: string | null
        slug: string
        title: string
        auto_email_on_publish: boolean
        publish_email_sent_at: Date | null
      }>(
        `SELECT c.campaign_id,
                a.email AS author_email, a.name AS author_name,
                cm.slug, cm.title, cm.auto_email_on_publish,
                c.publish_email_sent_at
           FROM contributions c
           JOIN authors a ON a.id = c.author_id
           JOIN campaigns cm ON cm.id = c.campaign_id
          WHERE c.id = $1`,
        [input.id],
      )
      const detail = rows[0]
      if (!detail) throw new Error("not found")
      const campaignId = detail.campaign_id

      if (input.status === "approved") {
        // Assign the next sequence number for this campaign's poem.
        await client.query(
          `UPDATE contributions
             SET status = 'approved',
                 email_verified = true,
                 moderation_reason = $2,
                 sequence_number = COALESCE(
                   (SELECT MAX(sequence_number) FROM contributions
                     WHERE campaign_id = $3 AND status = 'approved'), 0) + 1
           WHERE id = $1`,
          [input.id, input.reason ?? null, campaignId],
        )
        if (detail.auto_email_on_publish) {
          emailContext = {
            contributionId: input.id,
            email: detail.author_email,
            name: detail.author_name,
            slug: detail.slug,
            title: detail.title,
            alreadySent: detail.publish_email_sent_at != null,
          }
        }
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

  // Send the "your couplet is live" email once, after the commit.
  const ctx = emailContext as PublishEmailContext | null
  if (ctx && !ctx.alreadySent) {
    await sendPublishedEmail({
      to: ctx.email,
      name: ctx.name,
      campaignTitle: ctx.title,
      poemUrl: `${getSiteUrl()}/campaign/${ctx.slug}#poem`,
    })
    await query(
      `UPDATE contributions SET publish_email_sent_at = now() WHERE id = $1`,
      [ctx.contributionId],
    )
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

// ----------------------------------------------------------------------------
// Campaign create / update / delete
// ----------------------------------------------------------------------------

function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "campaign"
  )
}

export interface CampaignInput {
  title: string
  tagline: string
  description: string
  status: "draft" | "active" | "paused" | "completed"
  aiModeration: boolean
  aiLevel: "lenient" | "standard" | "strict"
  requireEmailVerification: boolean
  autoEmailOnPublish: boolean
  videoLink?: string | null
  donationLink?: string | null
}

export interface CampaignResult extends SubmitResult {
  id?: string
}

/** Create a new campaign. Generates a unique slug from the title. */
export async function createCampaign(
  input: CampaignInput,
): Promise<CampaignResult> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: "You must be signed in." }
  }

  const title = input.title?.trim()
  if (!title) return { ok: false, error: "Title is required." }

  const id = `cmp_${nanoid(12)}`
  // Ensure slug uniqueness with a short suffix.
  const slug = `${slugify(title)}-${nanoid(5).toLowerCase()}`

  try {
    await query(
      `INSERT INTO campaigns
         (id, slug, title, tagline, description, instructions, theme,
          accent_color, status, ai_moderation, ai_level,
          require_email_verification, auto_email_on_publish,
          background_image_url, campaign_images, video_link, donation_link,
          start_date, close_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
               $16, $17, now(), now() + interval '30 days', now(), now())`,
      [
        id,
        slug,
        title,
        input.tagline?.trim() ?? "",
        input.description?.trim() ?? "",
        [],
        "general",
        "#1f6f54",
        input.status,
        input.aiModeration,
        input.aiLevel,
        input.requireEmailVerification,
        input.autoEmailOnPublish,
        "/placeholder.svg?height=900&width=1600",
        [],
        input.videoLink?.trim() || null,
        input.donationLink?.trim() || null,
      ],
    )
  } catch (err) {
    console.log("[v0] createCampaign error:", err)
    return { ok: false, error: "Could not create this campaign." }
  }

  revalidatePath("/dashboard/campaigns")
  revalidatePath("/dashboard")
  revalidatePath("/")
  return { ok: true, id }
}

/** Update an existing campaign's editable fields. */
export async function updateCampaign(
  id: string,
  input: CampaignInput,
): Promise<CampaignResult> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: "You must be signed in." }
  }

  const title = input.title?.trim()
  if (!title) return { ok: false, error: "Title is required." }

  try {
    await query(
      `UPDATE campaigns
         SET title = $2, tagline = $3, description = $4, status = $5,
             ai_moderation = $6, ai_level = $7, video_link = $8,
             donation_link = $9, require_email_verification = $10,
             auto_email_on_publish = $11, updated_at = now()
       WHERE id = $1`,
      [
        id,
        title,
        input.tagline?.trim() ?? "",
        input.description?.trim() ?? "",
        input.status,
        input.aiModeration,
        input.aiLevel,
        input.videoLink?.trim() || null,
        input.donationLink?.trim() || null,
        input.requireEmailVerification,
        input.autoEmailOnPublish,
      ],
    )
  } catch (err) {
    console.log("[v0] updateCampaign error:", err)
    return { ok: false, error: "Could not save changes." }
  }

  revalidatePath("/dashboard/campaigns")
  revalidatePath("/dashboard")
  revalidatePath("/")
  return { ok: true, id }
}

/** Permanently delete a campaign and its contributions (cascade). */
export async function deleteCampaign(id: string): Promise<SubmitResult> {
  try {
    await requireAdmin()
  } catch {
    return { ok: false, error: "You must be signed in." }
  }

  try {
    await query(`DELETE FROM contributions WHERE campaign_id = $1`, [id])
    await query(`DELETE FROM moderation_settings WHERE campaign_id = $1`, [id])
    await query(`DELETE FROM campaigns WHERE id = $1`, [id])
  } catch (err) {
    console.log("[v0] deleteCampaign error:", err)
    return { ok: false, error: "Could not delete this campaign." }
  }

  revalidatePath("/dashboard/campaigns")
  revalidatePath("/dashboard")
  revalidatePath("/")
  return { ok: true }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}
