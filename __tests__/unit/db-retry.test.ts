import { describe, it, expect, vi, beforeEach } from "vitest"
import { isRetryable, withRetry, RETRYABLE_ERRORS } from "@/lib/db-retry-logic"

// ---------------------------------------------------------------------------
// isRetryable()
// ---------------------------------------------------------------------------
describe("isRetryable()", () => {
  it("returns true for exact connection timeout message", () => {
    expect(
      isRetryable(
        new Error("Connection terminated due to connection timeout"),
      ),
    ).toBe(true)
  })

  it("returns true for ECONNRESET", () => {
    expect(isRetryable(new Error("ECONNRESET"))).toBe(true)
  })

  it("returns true for ETIMEDOUT", () => {
    expect(isRetryable(new Error("ETIMEDOUT"))).toBe(true)
  })

  it("returns true when message contains a retryable substring", () => {
    expect(
      isRetryable(new Error("read ECONNRESET from socket")),
    ).toBe(true)
  })

  it("returns false for a SQL syntax error", () => {
    expect(isRetryable(new Error("syntax error at column 5"))).toBe(false)
  })

  it("returns false for an authorization error", () => {
    expect(isRetryable(new Error("permission denied for table users"))).toBe(
      false,
    )
  })

  it("returns false for non-Error values", () => {
    expect(isRetryable("a string error")).toBe(false)
    expect(isRetryable(null)).toBe(false)
    expect(isRetryable(42)).toBe(false)
  })

  it("covers all entries in RETRYABLE_ERRORS set", () => {
    for (const msg of RETRYABLE_ERRORS) {
      expect(isRetryable(new Error(msg))).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// withRetry()
// Use real timers — fake timers cause unhandled rejection warnings because
// the mock rejection fires before .rejects can attach.
// ---------------------------------------------------------------------------
describe("withRetry()", () => {
  it("returns the result on a successful first attempt", async () => {
    const fn = vi.fn().mockResolvedValue({ rows: [{ id: 1 }], rowCount: 1 })
    const result = await withRetry(fn)
    expect(result).toEqual({ rows: [{ id: 1 }], rowCount: 1 })
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("retries once on a retryable error and succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(
        new Error("Connection terminated due to connection timeout"),
      )
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })

    const result = await withRetry(fn)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(result).toEqual({ rows: [], rowCount: 0 })
  }, 10_000)

  it("retries up to 2 times and throws after exhausting retries", async () => {
    const fn = vi
      .fn()
      .mockRejectedValue(
        new Error("Connection terminated due to connection timeout"),
      )

    await expect(withRetry(fn)).rejects.toThrow(
      "Connection terminated due to connection timeout",
    )
    // 1 initial + 2 retries = 3 total calls
    expect(fn).toHaveBeenCalledTimes(3)
  }, 10_000)

  it("does NOT retry on a non-retryable error", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("syntax error at column 5"))

    await expect(withRetry(fn)).rejects.toThrow("syntax error at column 5")
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("respects a custom retries=0 (no retry)", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(
        new Error("Connection terminated due to connection timeout"),
      )

    await expect(withRetry(fn, 0)).rejects.toThrow()
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it("respects a custom retries=1 (one retry)", async () => {
    const fn = vi
      .fn()
      .mockRejectedValue(new Error("ECONNRESET"))

    await expect(withRetry(fn, 1)).rejects.toThrow("ECONNRESET")
    expect(fn).toHaveBeenCalledTimes(2)
  }, 10_000)
})
