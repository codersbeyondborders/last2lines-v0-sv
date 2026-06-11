import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { Button } from '@/components/ui/button'
import { APPROVED_COUNT, FLAGSHIP_CAMPAIGN } from '@/lib/mock-data'

export default function Home() {
  const campaign = FLAGSHIP_CAMPAIGN

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section
          aria-labelledby="hero-heading"
          className="mx-auto w-full max-w-6xl px-6 py-20 sm:py-28"
        >
          <div className="flex flex-col items-center gap-8 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
              <Sparkles className="size-3.5 text-primary" aria-hidden="true" />
              {campaign.title}
            </span>

            <h1
              id="hero-heading"
              className="max-w-4xl font-serif text-4xl font-semibold tracking-tight text-balance sm:text-6xl"
            >
              Two lines from you. One poem for the world.
            </h1>

            <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
              {campaign.description}
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <Button
                size="lg"
                nativeButton={false}
                className="h-11 px-6 text-base"
                render={
                  <Link href="/#contribute">
                    Add your lines
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                }
              />
              <Button
                size="lg"
                variant="outline"
                nativeButton={false}
                className="h-11 px-6 text-base"
                render={<Link href="/#tapestry">Read the tapestry</Link>}
              />
            </div>

            <p
              className="text-sm text-muted-foreground"
              aria-live="polite"
            >
              <span className="font-semibold text-foreground tabular-nums">
                {APPROVED_COUNT.toLocaleString()}
              </span>{' '}
              couplets woven so far
            </p>
          </div>
        </section>

        <section
          id="tapestry"
          aria-labelledby="tapestry-heading"
          className="border-t border-border/60 bg-secondary/40"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2
              id="tapestry-heading"
              className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              The Tapestry
            </h2>
            <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground text-pretty">
              The continuous, stitched poem of every approved couplet will live
              here. Coming together in the next phase.
            </p>
          </div>
        </section>

        <section
          id="contribute"
          aria-labelledby="contribute-heading"
          className="border-t border-border/60"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16">
            <h2
              id="contribute-heading"
              className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl"
            >
              Add your lines
            </h2>
            <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground text-pretty">
              The contribution form — exactly two lines, with live validation —
              arrives in the next phase.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
