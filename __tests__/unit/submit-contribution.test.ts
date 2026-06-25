import { describe, it, expect, vi, beforeEach } from "vitest"
import { query, withConnection } from "@/lib/db"

// ---------------------------------------------------------------------------
// Mock server-only dep in ai-moderation
// ---------------------------------------------------------------------------
vi.mock("server-only", () => ({}))

// ---------------------------------------------------------------------------
// Mock AI moderation — default to "publish" so DB path runs unless overridden
// ---------------------------------------------------------------------------
vi.mock("@/lib/ai-moderation", () => ({
  moderateCouplet: vi.fn().mockResolvedValue({
    decision: "publish",
    curatedLineOne: null,
    curatedLineTwo: null,
    reason: "On-theme.",
    fallback: false,
  }),
}))

import { submitContribution } from "@/lib/actions"
import { moderateCouplet } from "@/lib/ai-moderation"

const mockQuery = vi.mocked(query)
const mockWithConnection = vi.mocked(withConnection)
const mockModerate = vi.mocked(moderateCouplet)

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const VALID_INPUT = {
  campaignId: "cmp_test123",
  fullName: "Jane Doe",
  email: "jane@example.com",
  lineOne: "The forests breathe and sway",
  lineTwo: "In quiet green decay",
  consent: true,
}

const ACTIVE_CAMPAIGN = {
  id: "cmp_test123",
  slug: "save-forests",
  status: "active",
  start_date: new Date(Date.now() - 86400_000), // yesterday
  close_date: new Date(Date.now() + 86400_000), // tomorrow
  title: "Save Our Forests",
  theme: "Environmental conservation",
  description: "A poem about forests.",
  ai_moderation: false,
  ai_level: "standard" as const,
  require_email_verification: false,
}

function mockActiveCampaign() {
  mockQuery.mockResolvedValueOnce({ rows: [ACTIVE_CAMPAIGN], rowCount: 1 })
}

function mockWithConnectionSuccess() {
  mockWithConnection.mockImplementationOnce(async (fn) => {
    const mockClient = {
      query: vi.fn().mockResolvedValueOnce({
        rows: [{ id: "aut_abc123", status: "active" }],
        rowCount: 1,
      }).mockResolvedValueOnce({ rows: [], rowCount: 0 }),
    }
    return fn(mockClient as never)
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("submitContribution() — input validation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns error when fullName is missing", async () => {
    const result = await submitContribution({ ...VALID_INPUT, fullName: "" })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/name/i)
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it("returns error when email is missing", async () => {
    const result = await submitContribution({ ...VALID_INPUT, email: "" })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/email/i)
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it("returns error for an invalid email format", async () => {
    const result = await submitContribution({ ...VALID_INPUT, email: "not-an-email" })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/valid email/i)
  })

  it("returns error when lineOne is empty", async () => {
    const result = await submitContribution({ ...VALID_INPUT, lineOne: "" })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/both lines/i)
  })

  it("returns error when lineTwo is empty", async () => {
    const result = await submitContribution({ ...VALID_INPUT, lineTwo: "" })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/both lines/i)
  })

  it("returns error when lineOne exceeds 100 characters", async () => {
    const result = await submitContribution({
      ...VALID_INPUT,
      lineOne: "a".repeat(101),
    })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/100 characters/i)
  })

  it("returns error when lineTwo exceeds 100 characters", async () => {
    const result = await submitContribution({
      ...VALID_INPUT,
      lineTwo: "b".repeat(101),
    })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/100 characters/i)
  })

  it("accepts a line of exactly 100 characters without error from validation", async () => {
    mockActiveCampaign()
    mockWithConnectionSuccess()
    const result = await submitContribution({
      ...VALID_INPUT,
      lineOne: "a".repeat(100),
    })
    // Validation guard must not fire — result is ok or fails at DB level, never at length check
    expect(result.ok).toBe(true)
  })

  it("returns error when consent is false", async () => {
    const result = await submitContribution({ ...VALID_INPUT, consent: false })
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/terms/i)
  })

  it("trims whitespace from fullName and email before validation", async () => {
    mockActiveCampaign()
    mockWithConnectionSuccess()
    // Should not fail with surrounding whitespace — trimming must happen before validation
    const result = await submitContribution({
      ...VALID_INPUT,
      fullName: "  Jane Doe  ",
      email: "  jane@example.com  ",
    })
    expect(result.ok).toBe(true)
  })
})

describe("submitContribution() — campaign validation", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns error when campaign is not found", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    const result = await submitContribution(VALID_INPUT)
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/campaign not found/i)
  })

  it("returns error when campaign status is not active", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...ACTIVE_CAMPAIGN, status: "closed" }],
      rowCount: 1,
    })
    const result = await submitContribution(VALID_INPUT)
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/not currently accepting/i)
  })

  it("returns error when campaign has not started yet", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          ...ACTIVE_CAMPAIGN,
          start_date: new Date(Date.now() + 86400_000), // future
          close_date: new Date(Date.now() + 172800_000),
        },
      ],
      rowCount: 1,
    })
    const result = await submitContribution(VALID_INPUT)
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/not currently accepting/i)
  })

  it("returns error when campaign has already closed", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [
        {
          ...ACTIVE_CAMPAIGN,
          start_date: new Date(Date.now() - 172800_000),
          close_date: new Date(Date.now() - 86400_000), // past
        },
      ],
      rowCount: 1,
    })
    const result = await submitContribution(VALID_INPUT)
    expect(result.ok).toBe(false)
    expect(result.error).toMatch(/not currently accepting/i)
  })
})

describe("submitContribution() — AI moderation routing", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("skips AI moderation when campaign.ai_moderation is false", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...ACTIVE_CAMPAIGN, ai_moderation: false }],
      rowCount: 1,
    })
    mockWithConnectionSuccess()

    await submitContribution(VALID_INPUT)
    expect(mockModerate).not.toHaveBeenCalled()
  })

  it("calls AI moderation when campaign.ai_moderation is true", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ ...ACTIVE_CAMPAIGN, ai_moderation: true }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // previous couplets
    mockWithConnectionSuccess()
    mockModerate.mockResolvedValueOnce({
      decision: "publish",
      curatedLineOne: null,
      curatedLineTwo: null,
      reason: "On-theme.",
      fallback: false,
    })

    await submitContribution(VALID_INPUT)
    expect(mockModerate).toHaveBeenCalledOnce()
  })

  it("returns approved status when AI decision is publish", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ ...ACTIVE_CAMPAIGN, ai_moderation: true }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
    mockWithConnectionSuccess()
    mockModerate.mockResolvedValueOnce({
      decision: "publish",
      curatedLineOne: null,
      curatedLineTwo: null,
      reason: "On-theme.",
      fallback: false,
    })

    const result = await submitContribution(VALID_INPUT)
    expect(result.ok).toBe(true)
    expect(result.status).toBe("approved")
  })

  it("returns approved status when AI decision is curate", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ ...ACTIVE_CAMPAIGN, ai_moderation: true }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
    mockWithConnectionSuccess()
    mockModerate.mockResolvedValueOnce({
      decision: "curate",
      curatedLineOne: "The curated first line",
      curatedLineTwo: "The curated second line",
      reason: "Lightly edited for continuity.",
      fallback: false,
    })

    const result = await submitContribution(VALID_INPUT)
    expect(result.ok).toBe(true)
    expect(result.status).toBe("approved")
  })

  it("returns pending status when AI decision is manual", async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{ ...ACTIVE_CAMPAIGN, ai_moderation: true }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
    mockWithConnectionSuccess()
    mockModerate.mockResolvedValueOnce({
      decision: "manual",
      curatedLineOne: null,
      curatedLineTwo: null,
      reason: "Off-topic content detected.",
      fallback: false,
    })

    const result = await submitContribution(VALID_INPUT)
    expect(result.ok).toBe(true)
    expect(result.status).toBe("pending")
  })
})
