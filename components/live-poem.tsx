import { APPROVED_CONTRIBUTIONS, type Contribution } from "@/lib/mock-data"

export function LivePoem() {
  const couplets = APPROVED_CONTRIBUTIONS

  return (
    <section
      id="tapestry"
      aria-labelledby="tapestry-heading"
      className="border-t border-border/60 bg-secondary/40"
    >
      <div className="mx-auto w-full max-w-3xl px-6 py-16 sm:py-20">
        <header className="mb-10 text-center">
          <h2
            id="tapestry-heading"
            className="font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
          >
            The Living Poem
          </h2>
          <p className="mx-auto mt-3 max-w-xl leading-relaxed text-muted-foreground text-pretty">
            One unbroken verse, stitched two lines at a time by voices around the
            world. Read it from the top, and let it keep growing.
          </p>
        </header>

        {couplets.length === 0 ? (
          <p className="text-center text-muted-foreground">
            The poem is waiting for its first two lines. Be the one to begin it.
          </p>
        ) : (
          <article
            aria-label="The collective poem"
            className="rounded-2xl border border-border/70 bg-card px-6 py-10 ring-1 ring-foreground/5 sm:px-12 sm:py-14"
          >
            <ol className="flex flex-col">
              {couplets.map((couplet, index) => (
                <Couplet
                  key={couplet.id}
                  couplet={couplet}
                  isLast={index === couplets.length - 1}
                />
              ))}
            </ol>
          </article>
        )}
      </div>
    </section>
  )
}

function Couplet({
  couplet,
  isLast,
}: {
  couplet: Contribution
  isLast: boolean
}) {
  const author = couplet.authorName?.trim() || "Anonymous"

  return (
    <li
      className={
        isLast
          ? "pb-0"
          : "border-b border-border/40 pb-7 mb-7"
      }
    >
      <p className="font-serif text-pretty text-xl leading-relaxed text-foreground sm:text-2xl">
        {couplet.lineOne}
        <br />
        {couplet.lineTwo}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        <span aria-hidden="true">— </span>
        <cite className="not-italic font-medium text-foreground/80">
          {author}
        </cite>
        {couplet.country ? (
          <span className="text-muted-foreground">, {couplet.country}</span>
        ) : null}
      </p>
    </li>
  )
}
