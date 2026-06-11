import "server-only"
import { query } from "@/lib/db"
import type {
  Author,
  Campaign,
  Contribution,
  ModerationSettings,
} from "@/lib/mock-data"

// ----------------------------------------------------------------------------
// Row types (snake_case as returned by Postgres) + mappers to app shapes.
// ----------------------------------------------------------------------------

interface CampaignRow {
  id: string
  slug: string
  title: string
  tagline: string
  description: string
  instructions: string[]
  theme: string
  accent_color: string
  status: Campaign["status"]
  ai_moderation: boolean
  ai_level: Campaign["aiLevel"]
  background_image_url: string
  campaign_images: string[]
  video_link: string | null
  donation_link: string | null
  start_date: Date
  close_date: Date
  created_at: Date
  contribution_count?: string | number
}

function mapCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline,
    description: row.description,
    instructions: row.instructions ?? [],
    theme: row.theme,
    accentColor: row.accent_color,
    status: row.status,
    aiModeration: row.ai_moderation,
    aiLevel: row.ai_level,
    contributionCount:
      row.contribution_count != null ? Number(row.contribution_count) : 0,
    backgroundImageUrl: row.background_image_url,
    campaignImages: row.campaign_images ?? [],
    videoLink: row.video_link,
    donationLink: row.donation_link,
    startDate: new Date(row.start_date).toISOString(),
    closeDate: new Date(row.close_date).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
  }
}

interface ContributionRow {
  id: string
  campaign_id: string
  sequence_number: number
  line_one: string
  line_two: string
  author_id: string
  author_name: string | null
  author_email: string
  country: string | null
  status: Contribution["status"]
  moderation_reason: string | null
  created_at: Date
}

function mapContribution(row: ContributionRow): Contribution {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    sequenceNumber: row.sequence_number,
    lineOne: row.line_one,
    lineTwo: row.line_two,
    authorId: row.author_id,
    authorName: row.author_name,
    authorEmail: row.author_email,
    country: row.country,
    status: row.status,
    moderationReason: row.moderation_reason,
    createdAt: new Date(row.created_at).toISOString(),
  }
}

interface AuthorRow {
  id: string
  name: string | null
  email: string
  country: string | null
  status: Author["status"]
  joined_at: Date
}

function mapAuthor(row: AuthorRow): Author {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    country: row.country,
    status: row.status,
    joinedAt: new Date(row.joined_at).toISOString(),
  }
}

const CONTRIBUTION_SELECT = `
  SELECT c.id, c.campaign_id, c.sequence_number, c.line_one, c.line_two,
         c.author_id, a.name AS author_name, a.email AS author_email,
         a.country, c.status, c.moderation_reason, c.created_at
  FROM contributions c
  JOIN authors a ON a.id = c.author_id
`

// ----------------------------------------------------------------------------
// Campaign queries
// ----------------------------------------------------------------------------

/** All campaigns with their approved couplet counts, newest first. */
export async function getCampaigns(): Promise<Campaign[]> {
  const { rows } = await query<CampaignRow>(`
    SELECT c.*,
      (SELECT count(*) FROM contributions ct
        WHERE ct.campaign_id = c.id AND ct.status = 'approved') AS contribution_count
    FROM campaigns c
    ORDER BY c.created_at DESC
  `)
  return rows.map(mapCampaign)
}

export async function getCampaignBySlug(
  slug: string,
): Promise<Campaign | null> {
  const { rows } = await query<CampaignRow>(
    `
    SELECT c.*,
      (SELECT count(*) FROM contributions ct
        WHERE ct.campaign_id = c.id AND ct.status = 'approved') AS contribution_count
    FROM campaigns c
    WHERE c.slug = $1
    LIMIT 1
  `,
    [slug],
  )
  return rows[0] ? mapCampaign(rows[0]) : null
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  const { rows } = await query<CampaignRow>(
    `
    SELECT c.*,
      (SELECT count(*) FROM contributions ct
        WHERE ct.campaign_id = c.id AND ct.status = 'approved') AS contribution_count
    FROM campaigns c
    WHERE c.id = $1
    LIMIT 1
  `,
    [id],
  )
  return rows[0] ? mapCampaign(rows[0]) : null
}

// ----------------------------------------------------------------------------
// Contribution queries
// ----------------------------------------------------------------------------

/** Approved couplets for a campaign, ordered for display in the poem. */
export async function getApprovedContributions(
  campaignId: string,
): Promise<Contribution[]> {
  const { rows } = await query<ContributionRow>(
    `${CONTRIBUTION_SELECT}
     WHERE c.campaign_id = $1 AND c.status = 'approved'
     ORDER BY c.sequence_number ASC, c.created_at ASC`,
    [campaignId],
  )
  return rows.map(mapContribution)
}

/** Every contribution (all statuses), newest first — for the moderation queue. */
export async function getAllContributions(): Promise<Contribution[]> {
  const { rows } = await query<ContributionRow>(
    `${CONTRIBUTION_SELECT} ORDER BY c.created_at DESC`,
  )
  return rows.map(mapContribution)
}

export async function getContributionsByStatus(
  status: Contribution["status"],
): Promise<Contribution[]> {
  const { rows } = await query<ContributionRow>(
    `${CONTRIBUTION_SELECT} WHERE c.status = $1 ORDER BY c.created_at DESC`,
    [status],
  )
  return rows.map(mapContribution)
}

// ----------------------------------------------------------------------------
// Author + settings queries
// ----------------------------------------------------------------------------

export async function getAuthors(): Promise<Author[]> {
  const { rows } = await query<AuthorRow>(
    `SELECT * FROM authors ORDER BY joined_at DESC`,
  )
  return rows.map(mapAuthor)
}

/** Map of author id -> total submission count (all statuses). */
export async function getSubmissionCounts(): Promise<Record<string, number>> {
  const { rows } = await query<{ author_id: string; count: string }>(
    `SELECT author_id, count(*)::int AS count FROM contributions GROUP BY author_id`,
  )
  return Object.fromEntries(rows.map((r) => [r.author_id, Number(r.count)]))
}

export async function getModerationSettings(
  campaignId: string,
): Promise<ModerationSettings | null> {
  const { rows } = await query<{
    id: string
    campaign_id: string
    level: ModerationSettings["level"]
    profanity_filter: boolean
    enforce_theme: boolean
    confidence_threshold: string | number
    updated_at: Date
  }>(`SELECT * FROM moderation_settings WHERE campaign_id = $1 LIMIT 1`, [
    campaignId,
  ])
  const row = rows[0]
  if (!row) return null
  return {
    id: row.id,
    campaignId: row.campaign_id,
    level: row.level,
    profanityFilter: row.profanity_filter,
    enforceTheme: row.enforce_theme,
    confidenceThreshold: Number(row.confidence_threshold),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

// ----------------------------------------------------------------------------
// Dashboard aggregate
// ----------------------------------------------------------------------------

export interface DashboardSummary {
  totalCampaigns: number
  activeCampaigns: number
  pendingCount: number
  approvedCount: number
  authorCount: number
  bannedCount: number
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const { rows } = await query<{
    total_campaigns: string
    active_campaigns: string
    pending_count: string
    approved_count: string
    author_count: string
    banned_count: string
  }>(`
    SELECT
      (SELECT count(*) FROM campaigns) AS total_campaigns,
      (SELECT count(*) FROM campaigns WHERE status = 'active') AS active_campaigns,
      (SELECT count(*) FROM contributions WHERE status = 'pending') AS pending_count,
      (SELECT count(*) FROM contributions WHERE status = 'approved') AS approved_count,
      (SELECT count(*) FROM authors) AS author_count,
      (SELECT count(*) FROM authors WHERE status = 'banned') AS banned_count
  `)
  const r = rows[0]
  return {
    totalCampaigns: Number(r.total_campaigns),
    activeCampaigns: Number(r.active_campaigns),
    pendingCount: Number(r.pending_count),
    approvedCount: Number(r.approved_count),
    authorCount: Number(r.author_count),
    bannedCount: Number(r.banned_count),
  }
}
