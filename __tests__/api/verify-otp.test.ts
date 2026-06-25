import { describe, it, expect, vi, beforeEach } from "vitest"
import { createHash } from "crypto"
import { NextRequest } from "next/server"
import { query } from "@/lib/db"

const mockQuery = vi.mocked(query)

const { POST } = await import("@/app/api/verify-otp/route")

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const CODE = "123456"
const CODE_HASH = createHash("sha256").update(CODE).digest("hex")

const VALID_BODY = {
  email: "user@example.com",
  campaignId: "cmp_abc123",
  code: CODE,
}

const VALID_OTP = {
  id: "otp_xyz789",
  expires_at: new Date(Date.now() + 900_000).toISOString(), // 15 min from now
  used: false,
}

describe("POST /api/verify-otp", () => {
  beforeEach(() => vi.clearAllMocks())

  it("returns 400 when email is missing", async () => {
    const res = await POST(makeRequest({ campaignId: "cmp_1", code: "123456" }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/missing required/i)
  })

  it("returns 400 when campaignId is missing", async () => {
    const res = await POST(makeRequest({ email: "a@b.com", code: "123456" }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/missing required/i)
  })

  it("returns 400 when code is missing", async () => {
    const res = await POST(makeRequest({ email: "a@b.com", campaignId: "cmp_1" }))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/missing required/i)
  })

  it("returns 400 when code does not match any OTP in DB", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/invalid verification code/i)
  })

  it("returns 400 when OTP has already been used", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...VALID_OTP, used: true }],
      rowCount: 1,
    })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/already been used/i)
  })

  it("returns 400 when OTP has expired", async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ ...VALID_OTP, expires_at: new Date(Date.now() - 1000).toISOString() }],
      rowCount: 1,
    })
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/expired/i)
  })

  it("returns 200 and marks OTP used for a valid code", async () => {
    // SELECT query returns a valid OTP
    mockQuery.mockResolvedValueOnce({ rows: [VALID_OTP], rowCount: 1 })
    // UPDATE marks used
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 1 })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
    // Confirm the UPDATE was called to mark used
    expect(mockQuery).toHaveBeenCalledTimes(2)
    expect(mockQuery.mock.calls[1][0]).toContain("used = true")
  })

  it("sets Cache-Control: no-store on 200 response", async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [VALID_OTP], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 })

    const res = await POST(makeRequest(VALID_BODY))
    expect(res.headers.get("Cache-Control")).toContain("no-store")
  })

  it("returns 500 on unexpected DB error", async () => {
    mockQuery.mockRejectedValueOnce(new Error("DB connection lost"))
    const res = await POST(makeRequest(VALID_BODY))
    expect(res.status).toBe(500)
    expect(res.headers.get("Cache-Control")).toContain("no-store")
  })

  it("hashes the code before querying (does not send plaintext to DB)", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 })
    await POST(makeRequest(VALID_BODY))
    // The query call should use the hash, never the raw code
    const firstCall = mockQuery.mock.calls[0]
    expect(firstCall[1]).toContain(CODE_HASH)
    expect(firstCall[1]).not.toContain(CODE)
  })
})
