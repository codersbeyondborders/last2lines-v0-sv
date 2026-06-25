import { vi } from "vitest"

// ---------------------------------------------------------------------------
// Mock Next.js server-only modules so they don't blow up in vitest/node env
// ---------------------------------------------------------------------------
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn: unknown) => fn),
}))

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => new Map()),
}))

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Mock Supabase server client so auth calls don't need real credentials
// ---------------------------------------------------------------------------
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  })),
}))

// ---------------------------------------------------------------------------
// Mock the DB pool so no real AWS Aurora connections are opened
// ---------------------------------------------------------------------------
vi.mock("@/lib/db", () => ({
  query: vi.fn(),
  withConnection: vi.fn(async (fn: (client: unknown) => unknown) => {
    const mockClient = { query: vi.fn() }
    return fn(mockClient)
  }),
  pool: {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  },
}))

// ---------------------------------------------------------------------------
// Silence console.error in tests unless explicitly checked
// ---------------------------------------------------------------------------
vi.spyOn(console, "error").mockImplementation(() => {})
