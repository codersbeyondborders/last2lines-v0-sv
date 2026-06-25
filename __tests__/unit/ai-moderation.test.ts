import { describe, it, expect, vi, beforeEach } from "vitest"
import type { CoupletModerationInput } from "@/lib/ai-moderation"

// ---------------------------------------------------------------------------
// Mock "server-only" so vitest doesn't reject the import
// ---------------------------------------------------------------------------
vi.mock("server-only", () => ({}))

// ---------------------------------------------------------------------------
// Mock the AI SDK generateText call
// ---------------------------------------------------------------------------
const mockGenerateText = vi.fn()
vi.mock("ai", () => ({
  generateText: mockGenerateText,
  Output: { object: vi.fn(({ schema }) => ({ schema })) },
}))

// Import AFTER mocks are registered
const { moderateCouplet } = await import("@/lib/ai-moderation")

// ---------------------------------------------------------------------------
// Shared fixture
// ---------------------------------------------------------------------------
const baseInput: CoupletModerationInput = {
  lineOne: "The rivers run cold and clear",
  lineTwo: "Through forests that once stood here",
  level: "standard",
  campaignTitle: "Save Our Forests",
  campaignTheme: "Environmental conservation",
  campaignDescription: "A collective poem about deforestation and renewal.",
  previousCouplets: [],
}

describe("moderateCouplet()", () => {
  beforeEach(() => vi.clearAllMocks())

  // -------------------------------------------------------------------------
  // publish decision
  // -------------------------------------------------------------------------
  it("returns publish decision with nulled curated lines", async () => {
    mockGenerateText.mockResolvedValueOnce({
      experimental_output: {
        decision: "publish",
        curatedLineOne: null,
        curatedLineTwo: null,
        reason: "Lines are perfectly on-theme and safe.",
      },
    })

    const result = await moderateCouplet(baseInput)
    expect(result.decision).toBe("publish")
    expect(result.curatedLineOne).toBeNull()
    expect(result.curatedLineTwo).toBeNull()
    expect(result.fallback).toBe(false)
    expect(result.reason).toBeTruthy()
  })

  // -------------------------------------------------------------------------
  // curate decision
  // -------------------------------------------------------------------------
  it("returns curate decision with rewritten lines", async () => {
    mockGenerateText.mockResolvedValueOnce({
      experimental_output: {
        decision: "curate",
        curatedLineOne: "The rivers whisper past stone and clay",
        curatedLineTwo: "Where ancient trees once stood today",
        reason: "Lines were on-theme but needed minor rewrite for continuity.",
      },
    })

    const result = await moderateCouplet(baseInput)
    expect(result.decision).toBe("curate")
    expect(result.curatedLineOne).toBe("The rivers whisper past stone and clay")
    expect(result.curatedLineTwo).toBe("Where ancient trees once stood today")
    expect(result.fallback).toBe(false)
  })

  it("falls back to original lines when curate decision has null curated fields", async () => {
    mockGenerateText.mockResolvedValueOnce({
      experimental_output: {
        decision: "curate",
        curatedLineOne: null,
        curatedLineTwo: null,
        reason: "Lines needed editing.",
      },
    })

    const result = await moderateCouplet(baseInput)
    expect(result.decision).toBe("curate")
    // Should fall back to the original input lines
    expect(result.curatedLineOne).toBe(baseInput.lineOne)
    expect(result.curatedLineTwo).toBe(baseInput.lineTwo)
  })

  // -------------------------------------------------------------------------
  // manual decision
  // -------------------------------------------------------------------------
  it("returns manual decision with null curated lines", async () => {
    mockGenerateText.mockResolvedValueOnce({
      experimental_output: {
        decision: "manual",
        curatedLineOne: null,
        curatedLineTwo: null,
        reason: "Lines are off-topic and unrelated to the campaign.",
      },
    })

    const result = await moderateCouplet(baseInput)
    expect(result.decision).toBe("manual")
    expect(result.curatedLineOne).toBeNull()
    expect(result.curatedLineTwo).toBeNull()
    expect(result.fallback).toBe(false)
  })

  // -------------------------------------------------------------------------
  // AI failure fallback
  // -------------------------------------------------------------------------
  it("returns manual fallback when AI call throws", async () => {
    mockGenerateText.mockRejectedValueOnce(new Error("AI Gateway timeout"))

    const result = await moderateCouplet(baseInput)
    expect(result.decision).toBe("manual")
    expect(result.fallback).toBe(true)
    expect(result.curatedLineOne).toBeNull()
    expect(result.curatedLineTwo).toBeNull()
    expect(result.reason).toContain("unavailable")
  })

  it("never throws even when AI errors repeatedly", async () => {
    mockGenerateText.mockRejectedValue(new Error("Persistent failure"))
    await expect(moderateCouplet(baseInput)).resolves.toMatchObject({
      decision: "manual",
      fallback: true,
    })
  })

  // -------------------------------------------------------------------------
  // Level variations
  // -------------------------------------------------------------------------
  it("accepts lenient level and passes it to the AI prompt", async () => {
    mockGenerateText.mockResolvedValueOnce({
      experimental_output: {
        decision: "publish",
        curatedLineOne: null,
        curatedLineTwo: null,
        reason: "Acceptable under lenient standards.",
      },
    })

    const result = await moderateCouplet({ ...baseInput, level: "lenient" })
    expect(result.decision).toBe("publish")
    // The generateText prompt should have been called with lenient guidance
    const callArg = mockGenerateText.mock.calls[0][0]
    expect(callArg.system).toContain("lenient")
  })

  it("accepts strict level and passes it to the AI prompt", async () => {
    mockGenerateText.mockResolvedValueOnce({
      experimental_output: {
        decision: "curate",
        curatedLineOne: "A curated line one",
        curatedLineTwo: "A curated line two",
        reason: "Curated under strict standards.",
      },
    })

    const result = await moderateCouplet({ ...baseInput, level: "strict" })
    expect(result.decision).toBe("curate")
    const callArg = mockGenerateText.mock.calls[0][0]
    expect(callArg.system).toContain("strict")
  })

  // -------------------------------------------------------------------------
  // Previous couplets context
  // -------------------------------------------------------------------------
  it("includes previous couplets context in the prompt", async () => {
    mockGenerateText.mockResolvedValueOnce({
      experimental_output: {
        decision: "publish",
        curatedLineOne: null,
        curatedLineTwo: null,
        reason: "On-theme.",
      },
    })

    const inputWithHistory: CoupletModerationInput = {
      ...baseInput,
      previousCouplets: [
        { lineOne: "First line alpha", lineTwo: "Second line beta" },
      ],
    }

    await moderateCouplet(inputWithHistory)

    const callArg = mockGenerateText.mock.calls[0][0]
    expect(callArg.prompt).toContain("First line alpha")
    expect(callArg.prompt).toContain("Second line beta")
  })

  it("notes when there are no previous couplets in the prompt", async () => {
    mockGenerateText.mockResolvedValueOnce({
      experimental_output: {
        decision: "publish",
        curatedLineOne: null,
        curatedLineTwo: null,
        reason: "Fine.",
      },
    })

    await moderateCouplet(baseInput) // previousCouplets = []
    const callArg = mockGenerateText.mock.calls[0][0]
    expect(callArg.prompt).toContain("first couplet")
  })
})
