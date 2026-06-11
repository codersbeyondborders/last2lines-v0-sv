import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ModerationDashboard } from "@/components/moderation-dashboard"
import { FLAGSHIP_CAMPAIGN } from "@/lib/mock-data"

export const metadata: Metadata = {
  title: "Moderation Dashboard — Last2Lines",
  description:
    "Review, approve, and reject contributed couplets before they join the living poem.",
}

export default function DashboardPage() {
  const campaign = FLAGSHIP_CAMPAIGN

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <section
          aria-labelledby="dashboard-heading"
          className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16"
        >
          <header className="mb-8 flex flex-col gap-2">
            <p className="text-sm font-medium text-muted-foreground">
              {campaign.title}
            </p>
            <h1
              id="dashboard-heading"
              className="font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
            >
              Moderation Dashboard
            </h1>
            <p className="max-w-2xl leading-relaxed text-muted-foreground text-pretty">
              Couplets are auto-approved by AI, but you can review, approve, or
              reject any submission here. Borderline lines below the confidence
              threshold land in the pending queue.
            </p>
          </header>

          <ModerationDashboard />
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
