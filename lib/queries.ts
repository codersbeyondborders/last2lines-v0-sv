import "server-only"
import { query } from "@/lib/db"
import type {
  Author,
  Campaign,
  Contribution,
  ContributionStatus,
  ModerationSettings,
} from "@/lib/mock-data"

// ----------------------------------------------------------------------------
// Pagination helpers
// ----------------------------------------------------------------------------

const PAGE_SIZE = 50

export interface PagedResult<T> {
  items: T[]
  nextCursor: string | null
  total?: number
}

function encodeCursor(createdAt: Date | string, id: string): string {
  const iso =
    createdAt instanceof Date ? createdAt.toISOString() : createdAt
  return Buffer.from(`${iso}|${id}`).toString("base64url")
}

function decodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf-8")
    const pipeIdx = decoded.lastIndexOf("|")
    if (pipeIdx === -1) return null
    return {
      createdAt: decoded.slice(0, pipeIdx),
      id: decoded.slice(pipeIdx + 1),
    }
  } catch {
    return null
  }
}

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
  require_email_verification: boolean
  auto_email_on_publish: boolean
  featured: boolean
  start_date: Date
  close_date: Date
  created_at: Date
  contribution_count?: string | number
  partners: string[]
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
    requireEmailVerification: row.require_email_verification ?? false,
    autoEmailOnPublish: row.auto_email_on_publish ?? false,
    featured: row.featured ?? false,
    startDate: new Date(row.start_date).toISOString(),
    closeDate: new Date(row.close_date).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
    partners: row.partners ?? [],
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

// Shared SELECT fragment — used in all contribution queries.
const CONTRIBUTION_SELECT = `
  SELECT c.id, c.campaign_id, c.sequence_number, c.line_one, c.line_two,
         c.author_id, a.name AS author_name, a.email AS author_email,
         a.country, c.status, c.moderation_reason, c.created_at
  FROM contributions c
  JOIN authors a ON a.id = c.author_id
`

// Shared LEFT JOIN aggregate for contribution_count — avoids correlated subquery.
const CAMPAIGN_COUNT_JOIN = `
  LEFT JOIN (
    SELECT campaign_id, COUNT(*) AS contribution_count
    FROM contributions
    WHERE status = 'approved'
    GROUP BY campaign_id
  ) ct ON ct.campaign_id = c.id
`

// ----------------------------------------------------------------------------
// Campaign queries
// ----------------------------------------------------------------------------

/** All campaigns with their approved couplet counts, newest first. */
export async function getCampaigns(): Promise<Campaign[]> {
  const { rows } = await query<CampaignRow>(`
    SELECT c.*, COALESCE(ct.contribution_count, 0) AS contribution_count
    FROM campaigns c
    ${CAMPAIGN_COUNT_JOIN}
    ORDER BY c.created_at DESC
  `)
  return rows.map(mapCampaign)
}

export async function getCampaignBySlug(
  slug: string,
): Promise<Campaign | null> {
  const { rows } = await query<CampaignRow>(
    `
    SELECT c.*, COALESCE(ct.contribution_count, 0) AS contribution_count
    FROM campaigns c
    ${CAMPAIGN_COUNT_JOIN}
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
    SELECT c.*, COALESCE(ct.contribution_count, 0) AS contribution_count
    FROM campaigns c
    ${CAMPAIGN_COUNT_JOIN}
    WHERE c.id = $1
    LIMIT 1
    `,
    [id],
  )
  return rows[0] ? mapCampaign(rows[0]) : null
}

// Seed couplets for a campaign, ordered for display.
export interface SeedCouplet {
  id: string
  lineOne: string
  lineTwo: string
  author: string
}

export async function getSeedCouplets(
  campaignId: string,
): Promise<SeedCouplet[]> {
  const { rows } = await query<SeedCouplet>(
    `
    SELECT id, line_one AS "lineOne", line_two AS "lineTwo", author
    FROM seed_couplets
    WHERE campaign_id = $1
    ORDER BY sequence_number ASC
    `,
    [campaignId],
  )
  return rows
}

// ----------------------------------------------------------------------------
// Contribution queries
// ----------------------------------------------------------------------------

/** Approved couplets for a campaign, ordered for poem display. */
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

export interface GetContributionsOptions {
  /** Default 50. */
  limit?: number
  /** Opaque cursor from a previous PagedResult. */
  cursor?: string | null
  /** Omit or pass 'all' to return all statuses. */
  status?: ContributionStatus | "all"
  /** Filter by a specific author. */
  authorId?: string | null
  /** Filter by a specific campaign. */
  campaignId?: string | null
}

/**
 * Paginated contributions for the admin moderation queue.
 * Uses keyset (cursor) pagination on (created_at DESC, id DESC) to avoid
 * OFFSET degradation on large tables.
 */
export async function getAllContributions(
  opts: GetContributionsOptions = {},
): Promise<PagedResult<Contribution>> {
  const limit = Math.min(opts.limit ?? PAGE_SIZE, 200)
  const conditions: string[] = []
  const params: unknown[] = []

  if (opts.status && opts.status !== "all") {
    params.push(opts.status)
    conditions.push(`c.status = $${params.length}`)
  }

  if (opts.authorId) {
    params.push(opts.authorId)
    conditions.push(`c.author_id = $${params.length}`)
  }

  if (opts.campaignId) {
    params.push(opts.campaignId)
    conditions.push(`c.campaign_id = $${params.length}`)
  }

  // Keyset cursor: skip rows older than (or equal to) the previous last row.
  if (opts.cursor) {
    const decoded = decodeCursor(opts.cursor)
    if (decoded) {
      params.push(decoded.createdAt, decoded.id)
      const tsParam = `$${params.length - 1}`
      const idParam = `$${params.length}`
      conditions.push(`(c.created_at, c.id) < (${tsParam}, ${idParam})`)
    }
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  // Fetch one extra row to determine whether a next page exists.
  params.push(limit + 1)
  const { rows } = await query<ContributionRow>(
    `${CONTRIBUTION_SELECT}
     ${whereClause}
     ORDER BY c.created_at DESC, c.id DESC
     LIMIT $${params.length}`,
    params,
  )

  const hasMore = rows.length > limit
  const items = hasMore ? rows.slice(0, limit) : rows
  const lastItem = items[items.length - 1]

  return {
    items: items.map(mapContribution),
    nextCursor:
      hasMore && lastItem
        ? encodeCursor(lastItem.created_at, lastItem.id)
        : null,
  }
}

/** Counts per status for the moderation queue filter tabs. */
export interface ContributionStatusCounts {
  all: number
  pending: number
  approved: number
  rejected: number
}

export async function getContributionStatusCounts(opts?: {
  authorId?: string | null
  campaignId?: string | null
}): Promise<ContributionStatusCounts> {
  const conditions: string[] = []
  const params: unknown[] = []

  if (opts?.authorId) {
    params.push(opts.authorId)
    conditions.push(`author_id = $${params.length}`)
  }
  if (opts?.campaignId) {
    params.push(opts.campaignId)
    conditions.push(`campaign_id = $${params.length}`)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  const { rows } = await query<{
    all: string
    pending: string
    approved: string
    rejected: string
  }>(`
    SELECT
      COUNT(*) AS all,
      COUNT(*) FILTER (WHERE status = 'pending')  AS pending,
      COUNT(*) FILTER (WHERE status = 'approved') AS approved,
      COUNT(*) FILTER (WHERE status = 'rejected') AS rejected
    FROM contributions
    ${whereClause}
  `, params)

  const r = rows[0]
  return {
    all: Number(r.all),
    pending: Number(r.pending),
    approved: Number(r.approved),
    rejected: Number(r.rejected),
  }
}

/** @deprecated Use getAllContributions({ status }) instead. */
export async function getContributionsByStatus(
  status: Contribution["status"],
): Promise<Contribution[]> {
  const { items } = await getAllContributions({ status, limit: 200 })
  return items
}

// ----------------------------------------------------------------------------
// Author queries
// ----------------------------------------------------------------------------

export interface GetAuthorsOptions {
  limit?: number
  /** 1-based page number for offset pagination. */
  page?: number
  /** Search by author name or email (case-insensitive substring). */
  search?: string | null
  /** Filter to authors who have contributed to this campaign id. */
  campaignId?: string | null
  /** Filter by exact country code/name. */
  country?: string | null
  // Kept for backwards-compat (cursor arg is now ignored in favour of page).
  cursor?: string | null
}

export interface AuthorFilterOptions {
  campaigns: Array<{ id: string; title: string }>
  countries: string[]
}

/** Distinct campaigns and countries for populating filter dropdowns. */
export async function getAuthorFilterOptions(): Promise<AuthorFilterOptions> {
  const [campaignsRes, countriesRes] = await Promise.all([
    query<{ id: string; title: string }>(
      `SELECT DISTINCT c.id, c.title
       FROM campaigns c
       JOIN contributions ct ON ct.campaign_id = c.id
       ORDER BY c.title ASC`,
    ),
    query<{ country: string }>(
      `SELECT DISTINCT country FROM authors
       WHERE country IS NOT NULL AND country <> ''
       ORDER BY country ASC`,
    ),
  ])
  return {
    campaigns: campaignsRes.rows,
    countries: countriesRes.rows.map((r) => r.country),
  }
}

/** Paginated authors list, newest first. Supports search + filters. */
export async function getAuthors(
  opts: GetAuthorsOptions = {},
): Promise<PagedResult<Author> & { total: number }> {
  const PAGE_LIMIT = Math.min(opts.limit ?? 20, 100)
  const page = Math.max(1, opts.page ?? 1)
  const offset = (page - 1) * PAGE_LIMIT

  const conditions: string[] = []
  const params: unknown[] = []

  // Campaign filter — join contributions to find authors in that campaign.
  let joinClause = ""
  if (opts.campaignId) {
    params.push(opts.campaignId)
    joinClause = `JOIN contributions ct_f ON ct_f.author_id = a.id AND ct_f.campaign_id = $${params.length}`
  }

  if (opts.search) {
    params.push(`%${opts.search.trim()}%`)
    const p = params.length
    conditions.push(`(a.name ILIKE $${p} OR a.email ILIKE $${p})`)
  }

  if (opts.country) {
    params.push(opts.country)
    conditions.push(`a.country = $${params.length}`)
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""

  // Total count for pagination UI.
  const countParams = [...params]
  const { rows: countRows } = await query<{ total: string }>(
    `SELECT COUNT(DISTINCT a.id) AS total
     FROM authors a
     ${joinClause}
     ${whereClause}`,
    countParams,
  )
  const total = Number(countRows[0]?.total ?? 0)

  // Fetch the page.
  params.push(PAGE_LIMIT, offset)
  const { rows } = await query<AuthorRow>(
    `SELECT DISTINCT a.*
     FROM authors a
     ${joinClause}
     ${whereClause}
     ORDER BY a.joined_at DESC, a.id DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  )

  return {
    items: rows.map(mapAuthor),
    total,
    // nextCursor kept for interface compatibility — not used by the new pagination.
    nextCursor: page * PAGE_LIMIT < total ? String(page + 1) : null,
  }
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
// Homepage stats
// ----------------------------------------------------------------------------

export interface CampaignStatRow {
  id: string
  title: string
  slug: string
  status: string
  authors: number
  lines: number
}

export interface HomepageStats {
  totalCampaigns: number
  totalAuthors: number
  totalLines: number
  campaigns: CampaignStatRow[]
}

export async function getHomepageStats(): Promise<HomepageStats> {
  // Single round-trip: merge all scalar aggregates into one query.
  const { rows: agg } = await query<{
    total_campaigns: string
    total_authors: string
    total_lines: string
  }>(`
    SELECT
      (SELECT count(*) FROM campaigns     WHERE status != 'draft')   AS total_campaigns,
      (SELECT count(*) FROM authors       WHERE status = 'active')   AS total_authors,
      (SELECT count(*) * 2 FROM contributions WHERE status = 'approved') AS total_lines
  `)

  const { rows: campRows } = await query<{
    id: string
    title: string
    slug: string
    status: string
    authors: string
    lines: string
  }>(`
    SELECT
      c.id,
      c.title,
      c.slug,
      c.status,
      COUNT(DISTINCT ct.author_id) AS authors,
      COUNT(ct.id) * 2             AS lines
    FROM campaigns c
    LEFT JOIN contributions ct
      ON ct.campaign_id = c.id AND ct.status = 'approved'
    WHERE c.status != 'draft'
    GROUP BY c.id, c.title, c.slug, c.status
    ORDER BY c.created_at DESC
    LIMIT 20
  `)

  const r = agg[0]
  return {
    totalCampaigns: Number(r.total_campaigns),
    totalAuthors: Number(r.total_authors),
    totalLines: Number(r.total_lines),
    campaigns: campRows.map((row) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      status: row.status,
      authors: Number(row.authors),
      lines: Number(row.lines),
    })),
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
      (SELECT count(*) FROM campaigns)                          AS total_campaigns,
      (SELECT count(*) FROM campaigns WHERE status = 'active') AS active_campaigns,
      (SELECT count(*) FROM contributions WHERE status = 'pending')  AS pending_count,
      (SELECT count(*) FROM contributions WHERE status = 'approved') AS approved_count,
      (SELECT count(*) FROM authors)                           AS author_count,
      (SELECT count(*) FROM authors WHERE status = 'banned')   AS banned_count
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

export async function getContributionsByCountry(
  campaignId?: string,
): Promise<Array<{ country: string; count: number; percentage: number }>> {
  "use server"

  const params: unknown[] = []
  let campaignClause = ""
  if (campaignId) {
    params.push(campaignId)
    campaignClause = `AND c.campaign_id = $${params.length}`
  }

  const result = await query<{ country: string | null; count: string }>(
    `
    SELECT
      a.country,
      COUNT(c.id) AS count
    FROM contributions c
    JOIN authors a ON c.author_id = a.id
    WHERE c.status = 'approved'
    ${campaignClause}
    GROUP BY a.country
    ORDER BY count DESC
    `,
    params,
  )

  const rows = result.rows ?? []
  const total = rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0)

  return rows
    .filter((row) => row.country && row.country.trim() !== "")
    .map((row) => ({
      country: row.country ?? "Unknown",
      count: parseInt(row.count, 10),
      percentage: total > 0 ? (parseInt(row.count, 10) / total) * 100 : 0,
    }))
}

export type CountryDataPoint = {
  country: string
  count: number
  percentage: number
}

/**
 * Returns aggregate country data plus a per-campaign breakdown in one batch.
 * The record key is the campaign id; "all" holds the aggregate totals.
 */
export async function getContributionsByCountryAllCampaigns(
  campaignIds: string[],
): Promise<Record<string, CountryDataPoint[]>> {
  "use server"

  // Fetch aggregate (all campaigns)
  const aggResult = await query<{ country: string | null; count: string }>(
    `
    SELECT a.country, COUNT(c.id) AS count
    FROM contributions c
    JOIN authors a ON c.author_id = a.id
    WHERE c.status = 'approved'
    GROUP BY a.country
    ORDER BY count DESC
    `,
  )

  const toPoints = (
    rows: Array<{ country: string | null; count: string }>,
  ): CountryDataPoint[] => {
    const filtered = rows.filter((r) => r.country && r.country.trim() !== "")
    const total = filtered.reduce((s, r) => s + parseInt(r.count, 10), 0)
    return filtered.map((r) => ({
      country: r.country!,
      count: parseInt(r.count, 10),
      percentage: total > 0 ? (parseInt(r.count, 10) / total) * 100 : 0,
    }))
  }

  const result: Record<string, CountryDataPoint[]> = {
    all: toPoints(aggResult.rows ?? []),
  }

  // Per-campaign breakdown
  if (campaignIds.length > 0) {
    for (const id of campaignIds) {
      const { rows } = await query<{ country: string | null; count: string }>(
        `
        SELECT a.country, COUNT(c.id) AS count
        FROM contributions c
        JOIN authors a ON c.author_id = a.id
        WHERE c.status = 'approved' AND c.campaign_id = $1
        GROUP BY a.country
        ORDER BY count DESC
        `,
        [id],
      )
      result[id] = toPoints(rows ?? [])
    }
  }

  return result
}

// ----------------------------------------------------------------------------
// Contact submissions
// ----------------------------------------------------------------------------

export interface ContactSubmission {
  id: string
  type: "campaign_request" | "feedback" | "concern" | "general"
  name: string
  email: string
  subject: string | null
  message: string
  campaignName: string | null
  status: "new" | "read" | "archived"
  createdAt: string
}

export interface GetContactSubmissionsOptions {
  status?: "new" | "read" | "archived" | "all"
  type?: string | null
  page?: number
  limit?: number
}

export async function getContactSubmissions(
  opts: GetContactSubmissionsOptions = {},
): Promise<{ items: ContactSubmission[]; total: number }> {
  const limit = Math.min(opts.limit ?? 20, 100)
  const page = Math.max(1, opts.page ?? 1)
  const offset = (page - 1) * limit
  const conditions: string[] = []
  const params: unknown[] = []

  if (opts.status && opts.status !== "all") {
    params.push(opts.status)
    conditions.push(`status = $${params.length}`)
  }
  if (opts.type && opts.type !== "all") {
    params.push(opts.type)
    conditions.push(`type = $${params.length}`)
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""
  const baseParams = [...params]

  const [countRes, rowsRes] = await Promise.all([
    query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM contact_submissions ${where}`,
      baseParams,
    ),
    query<{
      id: string
      type: string
      name: string
      email: string
      subject: string | null
      message: string
      campaign_name: string | null
      status: string
      created_at: Date
    }>(
      `SELECT * FROM contact_submissions ${where}
       ORDER BY created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    ),
  ])

  return {
    total: Number(countRes.rows[0]?.total ?? 0),
    items: rowsRes.rows.map((r) => ({
      id: r.id,
      type: r.type as ContactSubmission["type"],
      name: r.name,
      email: r.email,
      subject: r.subject,
      message: r.message,
      campaignName: r.campaign_name,
      status: r.status as ContactSubmission["status"],
      createdAt: new Date(r.created_at).toISOString(),
    })),
  }
}
