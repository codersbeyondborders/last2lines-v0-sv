/**
 * Route-level loading UI for the homepage.
 * Next.js streams this shell while the page RSC fetches data.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col" aria-busy="true" aria-label="Loading page">
      {/* Header skeleton */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
          <div className="h-5 w-28 animate-pulse rounded bg-muted" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            <div className="h-8 w-20 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
      </div>

      <main className="flex-1">
        {/* Hero skeleton */}
        <section className="bg-muted/40 dark:bg-muted/15" aria-hidden="true">
          <div className="mx-auto w-full max-w-6xl px-6 py-16 text-center sm:py-24">
            <div className="mx-auto mb-3 h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="mx-auto mt-4 h-12 w-3/4 animate-pulse rounded-lg bg-muted sm:h-14" />
            <div className="mx-auto mt-4 h-6 w-2/3 animate-pulse rounded bg-muted" />
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-11 w-36 animate-pulse rounded-md bg-muted" />
              ))}
            </div>
          </div>
        </section>

        {/* Stats skeleton */}
        <div className="border-y border-border/60 bg-muted/50 dark:bg-muted/20">
          <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
            <div className="grid grid-cols-1 gap-px sm:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2 py-6 sm:py-0">
                  <div className="h-14 w-24 animate-pulse rounded-lg bg-muted" />
                  <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Campaign grid skeleton */}
        <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
          <div className="mb-8 flex flex-col gap-4">
            <div className="h-11 w-full animate-pulse rounded-lg bg-muted" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-20 animate-pulse rounded-full bg-muted" />
              ))}
            </div>
          </div>
          <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <li key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
            ))}
          </ul>
        </div>
      </main>
    </div>
  )
}
