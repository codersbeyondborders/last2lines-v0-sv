/**
 * Route-level loading UI for the campaign detail page.
 * Streams the shell while the campaign RSC fetches from the DB.
 */
export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col bg-background" aria-busy="true" aria-label="Loading campaign">
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
        {/* Hero image skeleton */}
        <div className="relative min-h-[24rem] w-full animate-pulse bg-muted sm:min-h-[28rem]" aria-hidden="true">
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-14">
            <div className="mx-auto w-full max-w-6xl">
              <div className="mb-4 h-6 w-24 animate-pulse rounded-full bg-muted-foreground/20" />
              <div className="h-10 w-2/3 animate-pulse rounded-lg bg-muted-foreground/20 sm:h-12" />
              <div className="mt-3 h-6 w-1/2 animate-pulse rounded bg-muted-foreground/20" />
            </div>
          </div>
        </div>

        {/* Stats bar skeleton */}
        <section className="border-b border-border">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
            <div className="h-4 w-28 animate-pulse rounded bg-muted" />
            <dl className="mt-6 grid grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-card px-4 py-5 text-center">
                  <div className="mx-auto h-3 w-12 animate-pulse rounded bg-muted" />
                  <div className="mx-auto mt-2 h-8 w-16 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* About + instructions skeleton */}
        <section className="border-b border-border">
          <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-3">
              <div className="h-6 w-44 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
              <div className="mt-4 flex gap-3">
                <div className="h-8 w-32 animate-pulse rounded-md bg-muted" />
                <div className="h-8 w-36 animate-pulse rounded-md bg-muted" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-6 w-36 animate-pulse rounded bg-muted" />
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="size-6 shrink-0 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Poem skeleton */}
        <section className="border-b border-border">
          <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="mb-8 text-center">
              <div className="mx-auto h-8 w-64 animate-pulse rounded bg-muted" />
            </div>
            <div className="space-y-6 py-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="mx-auto h-4 w-2/3 animate-pulse rounded bg-muted" />
                  <div className="mx-auto h-4 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
