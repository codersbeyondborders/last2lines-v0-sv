/**
 * Pure retry utilities for database queries.
 * Extracted into a separate module so they can be unit-tested without
 * importing pg, AWS SDK, or Vercel OIDC dependencies.
 */

export const RETRYABLE_ERRORS = new Set([
  "Connection terminated due to connection timeout",
  "Connection terminated unexpectedly",
  "connection timeout",
  "ECONNRESET",
  "ETIMEDOUT",
])

export function isRetryable(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  return (
    RETRYABLE_ERRORS.has(err.message) ||
    [...RETRYABLE_ERRORS].some((msg) => err.message.includes(msg))
  )
}

/**
 * Execute `fn` with automatic retry on transient connection errors.
 * @param fn   The async database operation to attempt.
 * @param retries  Number of retries remaining (default: 2).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    if (retries > 0 && isRetryable(err)) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      return withRetry(fn, retries - 1)
    }
    throw err
  }
}
