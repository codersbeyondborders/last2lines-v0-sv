import Link from 'next/link'
import { Feather } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Feather className="size-3.5" aria-hidden="true" />
          </span>
          <p className="text-sm text-muted-foreground text-pretty">
            Last2Lines — turning whispers into a global chorus.
          </p>
        </div>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
        >
          <Link
            href="/"
            className="rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Campaigns
          </Link>
          <Link
            href="/#campaigns"
            className="rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Browse
          </Link>
          <Link
            href="/dashboard"
            className="rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Moderation
          </Link>
        </nav>
      </div>
    </footer>
  )
}
