// High-fidelity mock data mirroring the Aurora PostgreSQL payload.
// Replaced with real queries in Phase 3.

export type CampaignStatus = 'active' | 'archived'
export type ContributionStatus = 'pending' | 'approved' | 'rejected'
export type ModerationLevel = 'lenient' | 'balanced' | 'strict'

export interface Campaign {
  id: string
  slug: string
  title: string
  tagline: string
  description: string
  theme: string
  accentColor: string
  status: CampaignStatus
  createdAt: string
}

export interface Contribution {
  id: string
  campaignId: string
  lineOne: string
  lineTwo: string
  authorName: string | null
  authorEmail: string
  country: string | null
  status: ContributionStatus
  moderationReason: string | null
  createdAt: string
}

export interface ModerationSettings {
  id: string
  campaignId: string
  level: ModerationLevel
  profanityFilter: boolean
  enforceTheme: boolean
  confidenceThreshold: number
  updatedAt: string
}

export const FLAGSHIP_CAMPAIGN: Campaign = {
  id: 'cmp_earth',
  slug: 'two-lines-for-the-earth',
  title: 'Two Lines for the Earth',
  tagline: 'A living poem written by the world, for the world.',
  description:
    'Add exactly two lines to a single, continuously growing poem about our shared home. Every approved couplet is stitched into one endless tapestry of collective hope, grief, and resolve.',
  theme: 'climate',
  accentColor: 'emerald',
  status: 'active',
  createdAt: '2026-01-12T09:00:00.000Z',
}

export const MOCK_CONTRIBUTIONS: Contribution[] = [
  {
    id: 'ctr_001',
    campaignId: 'cmp_earth',
    lineOne: 'The glaciers keep a diary in blue,',
    lineTwo: 'and every page we burn, they read aloud.',
    authorName: 'Maya R.',
    authorEmail: 'maya@example.com',
    country: 'Canada',
    status: 'approved',
    moderationReason: null,
    createdAt: '2026-06-01T08:12:00.000Z',
  },
  {
    id: 'ctr_002',
    campaignId: 'cmp_earth',
    lineOne: 'I planted a word where the forest had been,',
    lineTwo: 'it grew into a sentence of leaves again.',
    authorName: 'Tomás',
    authorEmail: 'tomas@example.com',
    country: 'Brazil',
    status: 'approved',
    moderationReason: null,
    createdAt: '2026-06-02T14:40:00.000Z',
  },
  {
    id: 'ctr_003',
    campaignId: 'cmp_earth',
    lineOne: 'The ocean is not angry, only honest,',
    lineTwo: 'it returns to us exactly what we gave.',
    authorName: null,
    authorEmail: 'anon@example.com',
    country: 'Australia',
    status: 'approved',
    moderationReason: null,
    createdAt: '2026-06-03T19:05:00.000Z',
  },
  {
    id: 'ctr_004',
    campaignId: 'cmp_earth',
    lineOne: 'A child asked the sky why it kept coughing,',
    lineTwo: 'and none of the adults knew where to look.',
    authorName: 'Lena K.',
    authorEmail: 'lena@example.com',
    country: 'Germany',
    status: 'approved',
    moderationReason: null,
    createdAt: '2026-06-04T11:22:00.000Z',
  },
  {
    id: 'ctr_005',
    campaignId: 'cmp_earth',
    lineOne: 'We are the last two lines of an old song,',
    lineTwo: 'so let us make the ending worth the wait.',
    authorName: 'Priya',
    authorEmail: 'priya@example.com',
    country: 'India',
    status: 'approved',
    moderationReason: null,
    createdAt: '2026-06-05T07:48:00.000Z',
  },
  {
    id: 'ctr_006',
    campaignId: 'cmp_earth',
    lineOne: 'Buy our energy drink, smash that subscribe,',
    lineTwo: 'link in bio for the lowest prices online!',
    authorName: 'promo_bot',
    authorEmail: 'spam@example.com',
    country: null,
    status: 'rejected',
    moderationReason: 'Off-theme / promotional spam',
    createdAt: '2026-06-05T09:10:00.000Z',
  },
  {
    id: 'ctr_007',
    campaignId: 'cmp_earth',
    lineOne: 'The rivers remember every name we forgot,',
    lineTwo: 'they whisper them back each time it rains.',
    authorName: 'Sven',
    authorEmail: 'sven@example.com',
    country: 'Norway',
    status: 'pending',
    moderationReason: null,
    createdAt: '2026-06-10T16:30:00.000Z',
  },
  {
    id: 'ctr_008',
    campaignId: 'cmp_earth',
    lineOne: 'Hope is a seed that refuses the drought,',
    lineTwo: 'and roots itself deeper the drier it gets.',
    authorName: 'Amara',
    authorEmail: 'amara@example.com',
    country: 'Kenya',
    status: 'pending',
    moderationReason: null,
    createdAt: '2026-06-11T05:55:00.000Z',
  },
]

export const MOCK_MODERATION_SETTINGS: ModerationSettings = {
  id: 'mds_earth',
  campaignId: 'cmp_earth',
  level: 'balanced',
  profanityFilter: true,
  enforceTheme: true,
  confidenceThreshold: 0.7,
  updatedAt: '2026-06-09T10:00:00.000Z',
}

export const APPROVED_CONTRIBUTIONS = MOCK_CONTRIBUTIONS.filter(
  (c) => c.status === 'approved',
)

export const APPROVED_COUNT = APPROVED_CONTRIBUTIONS.length

// Each approved couplet contributes 2 lines to the living poem.
export const LINE_COUNT = APPROVED_COUNT * 2

// Distinct authors (anonymous contributions counted once collectively).
export const AUTHOR_COUNT = new Set(
  APPROVED_CONTRIBUTIONS.map((c) => c.authorName?.trim() || 'anonymous'),
).size
