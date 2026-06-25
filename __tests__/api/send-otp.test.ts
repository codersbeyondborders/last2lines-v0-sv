import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { query } from "@/lib/db"

const mockQuery = vi.mocked(query)

// Import route after mocks are registered via setup.ts
const { POST } = await import("@/app/api/send-otp/route")

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/send-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = {
  email: "user@example.com",
  campaignId: "cmp_abc123",
  campaignTitle: "Save Our Forests",
}

describe("POST /api/send-otp", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({ campaignId: "cmp_1", campaignTitle: "T" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/missing required/i)
  })

  it("returns 400 when campaignId is missing", async () => {
    const res = await POST(makeRequest({ email: "a@b.com", campaignTitle: "T" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/missing required/i)
  })

  it("returns 400 when campaignTitle is missing", async () => {
    const res = await POST(makeRequest({ email: "a@b.com", campaignId: "cmp_1" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/missing required/i)
  })

  it("returns 404 when campaign is not found in DB", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(404)
    const body = await res.json()
    expect(body.error).toMatch(/campaign not found/i)
  })

  it("returns 200 with mock code in mock mode when campaign exists", async () => {
    // Campaign check
    mockQuery.mockResolvedValueOnce({ rows: [{ id: "cmp_abc123" }], rowCount: 1 })
    // Invalidate old OTPs
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    // Insert new OTP
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.mock).toBe(true)
    expect(body.mockCode).toBe("123456")
  })

  it("sets Cache-Control: no-store on success response", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [{ id: "cmp_abc123" }], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.headers.get("Cache-Control")).toContain("no-store")
  })

  it("returns 500 and sets Cache-Control on unexpected DB error", async () => {
    mockQuery.mockRejectedValueOnce(new Error("DB exploded"))
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(500)
    expect(res.headers.get("Cache-Control")).toContain("no-store")
  })
})
