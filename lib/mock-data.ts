// High-fidelity mock data mirroring the Aurora PostgreSQL payload.
// Replaced with real queries in Phase 3.

export type CampaignStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived'
export type ContributionStatus = 'pending' | 'approved' | 'rejected'
export type ModerationLevel = 'lenient' | 'standard' | 'strict'
export type AuthorStatus = 'active' | 'banned'

export interface Campaign {
  id: string
  slug: string
  title: string
  tagline: string
  description: string
  theme: string
  accentColor: string
  status: CampaignStatus
  /** When true, the AI auto-moderates submissions. Admin-controlled per campaign. */
  aiModeration: boolean
  aiLevel: ModerationLevel
  contributionCount: number
  videoLink: string | null
  donationLink: string | null
  createdAt: string
}

export interface Contribution {
  id: string
  campaignId: string
  sequenceNumber: number
  lineOne: string
  lineTwo: string
  authorId: string
  authorName: string | null
  authorEmail: string
  country: string | null
  status: ContributionStatus
  /** Feedback from the AI moderation pass (or manual note). */
  moderationReason: string | null
  createdAt: string
}

export interface Author {
  id: string
  name: string | null
  email: string
  country: string | null
  status: AuthorStatus
  joinedAt: string
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

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'cmp_earth',
    slug: 'two-lines-for-the-earth',
    title: 'Two Lines for the Earth',
    tagline: 'A living poem written by the world, for the world.',
    description:
      'Add exactly two lines to a single, continuously growing poem about our shared home. Every approved couplet is stitched into one endless tapestry of collective hope, grief, and resolve.',
    theme: 'climate',
    accentColor: 'emerald',
    status: 'active',
    aiModeration: true,
    aiLevel: 'standard',
    contributionCount: 8,
    videoLink: 'https://example.com/earth-intro',
    donationLink: 'https://example.com/donate/earth',
    createdAt: '2026-01-12T09:00:00.000Z',
  },
  {
    id: 'cmp_water',
    slug: 'rivers-remember',
    title: 'Rivers Remember',
    tagline: 'Two lines for every vanishing waterway.',
    description:
      'A campaign gathering couplets that honor the rivers, lakes, and oceans we are losing — and the ones we can still save.',
    theme: 'water',
    accentColor: 'emerald',
    status: 'draft',
    aiModeration: true,
    aiLevel: 'strict',
    contributionCount: 0,
    videoLink: null,
    donationLink: 'https://example.com/donate/water',
    createdAt: '2026-05-28T13:30:00.000Z',
  },
  {
    id: 'cmp_forests',
    slug: 'last-canopy',
    title: 'The Last Canopy',
    tagline: "Couplets for the world's forests.",
    description:
      'A completed seasonal campaign celebrating the forests and the people who defend them.',
    theme: 'forests',
    accentColor: 'emerald',
    status: 'completed',
    aiModeration: false,
    aiLevel: 'lenient',
    contributionCount: 142,
    videoLink: 'https://example.com/canopy',
    donationLink: null,
    createdAt: '2025-09-01T08:00:00.000Z',
  },
]

// The flagship campaign powers the public-facing landing page.
export const FLAGSHIP_CAMPAIGN: Campaign = MOCK_CAMPAIGNS[0]

export const MOCK_AUTHORS: Author[] = [
  {
    id: 'aut_maya',
    name: 'Maya R.',
    email: 'maya@example.com',
    country: 'Canada',
    status: 'active',
    joinedAt: '2026-05-30T08:00:00.000Z',
  },
  {
    id: 'aut_tomas',
    name: 'Tomás',
    email: 'tomas@example.com',
    country: 'Brazil',
    status: 'active',
    joinedAt: '2026-05-31T10:00:00.000Z',
  },
  {
    id: 'aut_anon',
    name: null,
    email: 'anon@example.com',
    country: 'Australia',
    status: 'active',
    joinedAt: '2026-06-01T12:00:00.000Z',
  },
  {
    id: 'aut_lena',
    name: 'Lena K.',
    email: 'lena@example.com',
    country: 'Germany',
    status: 'active',
    joinedAt: '2026-06-02T09:00:00.000Z',
  },
  {
    id: 'aut_priya',
    name: 'Priya',
    email: 'priya@example.com',
    country: 'India',
    status: 'active',
    joinedAt: '2026-06-03T07:00:00.000Z',
  },
  {
    id: 'aut_spam',
    name: 'promo_bot',
    email: 'spam@example.com',
    country: null,
    status: 'banned',
    joinedAt: '2026-06-05T09:00:00.000Z',
  },
  {
    id: 'aut_sven',
    name: 'Sven',
    email: 'sven@example.com',
    country: 'Norway',
    status: 'active',
    joinedAt: '2026-06-10T16:00:00.000Z',
  },
  {
    id: 'aut_amara',
    name: 'Amara',
    email: 'amara@example.com',
    country: 'Kenya',
    status: 'active',
    joinedAt: '2026-06-11T05:00:00.000Z',
  },
]

export const MOCK_CONTRIBUTIONS: Contribution[] = [
  {
    id: 'ctr_001',
    campaignId: 'cmp_earth',
    sequenceNumber: 1,
    lineOne: 'The glaciers keep a diary in blue,',
    lineTwo: 'and every page we burn, they read aloud.',
    authorId: 'aut_maya',
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
    sequenceNumber: 2,
    lineOne: 'I planted a word where the forest had been,',
    lineTwo: 'it grew into a sentence of leaves again.',
    authorId: 'aut_tomas',
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
    sequenceNumber: 3,
    lineOne: 'The ocean is not angry, only honest,',
    lineTwo: 'it returns to us exactly what we gave.',
    authorId: 'aut_anon',
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
    sequenceNumber: 4,
    lineOne: 'A child asked the sky why it kept coughing,',
    lineTwo: 'and none of the adults knew where to look.',
    authorId: 'aut_lena',
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
    sequenceNumber: 5,
    lineOne: 'We are the last two lines of an old song,',
    lineTwo: 'so let us make the ending worth the wait.',
    authorId: 'aut_priya',
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
    sequenceNumber: 0,
    lineOne: 'Buy our energy drink, smash that subscribe,',
    lineTwo: 'link in bio for the lowest prices online!',
    authorId: 'aut_spam',
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
    sequenceNumber: 0,
    lineOne: 'The rivers remember every name we forgot,',
    lineTwo: 'they whisper them back each time it rains.',
    authorId: 'aut_sven',
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
    sequenceNumber: 0,
    lineOne: 'Hope is a seed that refuses the drought,',
    lineTwo: 'and roots itself deeper the drier it gets.',
    authorId: 'aut_amara',
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
  level: 'standard',
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
