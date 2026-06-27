import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BookOpen } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCampaigns, getApprovedContributions, getSeedCouplets } from "@/lib/queries"
import { getCampaignPhase, formatCampaignDate } from "@/lib/mock-data"
import type { Campaign } from "@/lib/mock-data"

export const revalidate = 60

export const metadata = {
  title: "Archives — Last2Lines",
  description:
    "Browse every collective poem built through Last2Lines campaigns — past and present, one couplet at a time.",
}

const PHASE_LABEL: Record<string, string> = {
  active: "Active",
  upcoming: "Upcoming",
  completed: "Completed",
}

const PHASE_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  active: "default",
  upcoming: "outline",
  completed: "secondary",
}

async function getCampaignsWithCounts() {
  const campaigns = await getCampaigns()
  // Fetch couplet counts in parallel for all published campaigns
  const published = campaigns.filter((c) => c.status !== "draft")
  const counts = await Promise.all(
    published.map(async (c) => {
      const [contributions, seeds] = await Promise.all([
        getApprovedContributions(c.id),
        getSeedCouplets(c.id),
      ])
      return {
        campaignId: c.id,
        couplets: contributions.length + seeds.length,
        authors: new Set(contributions.map((ct) => ct.authorName?.trim() || ct.authorId)).size,
      }
    }),
  )
  const countMap = Object.fromEntries(counts.map((c) => [c.campaignId, c]))
  return { campaigns: published, countMap }
}

export default async function ArchivesPage() {
  const { campaigns, countMap } = await getCampaignsWithCounts()

  const active = campaigns.filter((c) => getCampaignPhase(c) === "active")
  const upcoming = campaigns.filter((c) => getCampaignPhase(c) === "upcoming")
  const completed = campaigns.filter((c) => getCampaignPhase(c) === "completed")

  const groups = [
    { label: "Active campaigns", items: active },
    { label: "Upcoming campaigns", items: upcoming },
    { label: "Completed campaigns", items: completed },
  ].filter((g) => g.items.length > 0)

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Page header */}
        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="size-6 text-primary" aria-hidden="true" />
              <span className="text-sm font-medium uppercase tracking-widest text-primary">
                Archives
              </span>
            </div>
            <h1 className="font-serif text-3xl font-semibold text-balance sm:text-4xl">
              All collective poems
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty">
              Every campaign on Last2Lines weaves a poem from voices around the world. Browse the full archive — read each poem as one continuous piece, search by couplet, and add your two lines while campaigns are still open.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              {campaigns.length} poem{campaigns.length !== 1 ? "s" : ""} in the archive
            </p>
          </div>
        </section>

        {/* Campaign groups */}
        {campaigns.length === 0 ? (
          <section className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6 text-center">
            <p className="font-serif text-xl font-medium">No poems yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back soon — campaigns are on their way.
            </p>
          </section>
        ) : (
          <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6 sm:py-16 flex flex-col gap-16">
            {groups.map((group) => (
              <section key={group.label} aria-labelledby={`group-${group.label.replace(/\s+/g, "-")}`}>
                <h2
                  id={`group-${group.label.replace(/\s+/g, "-")}`}
                  className="mb-6 font-serif text-xl font-semibold"
                >
                  {group.label}
                </h2>
                <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" role="list">
                  {group.items.map((campaign) => (
                    <ArchiveCard
                      key={campaign.id}
                      campaign={campaign}
                      counts={countMap[campaign.id] ?? { couplets: 0, authors: 0 }}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  )
}

function ArchiveCard({
  campaign,
  counts,
}: {
  campaign: Campaign
  counts: { couplets: number; authors: number }
}) {
  const phase = getCampaignPhase(campaign)

  return (
    <li className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
      {/* Thumbnail */}
      <div className="relative h-40 w-full overflow-hidden">
        <Image
          src={campaign.backgroundImageUrl || "/placeholder.svg?height=160&width=400"}
          alt=""
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
          aria-hidden="true"
        />
        <div className="absolute bottom-3 left-3">
          <Badge variant={PHASE_VARIANT[phase]}>
            {PHASE_LABEL[phase]}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex-1">
          <h3 className="font-serif text-lg font-semibold leading-snug text-balance">
            {campaign.title}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2 text-pretty">
            {campaign.tagline}
          </p>
        </div>

        {/* Stats */}
        <dl className="flex items-center gap-4 text-xs text-muted-foreground border-t border-border pt-3">
          <div>
            <dt className="sr-only">Couplets</dt>
            <dd>
              <span className="font-semibold tabular-nums text-foreground">
                {counts.couplets.toLocaleString()}
              </span>{" "}
              couplet{counts.couplets !== 1 ? "s" : ""}
            </dd>
          </div>
          <div>
            <dt className="sr-only">Authors</dt>
            <dd>
              <span className="font-semibold tabular-nums text-foreground">
                {counts.authors.toLocaleString()}
              </span>{" "}
              author{counts.authors !== 1 ? "s" : ""}
            </dd>
          </div>
          <div className="ml-auto text-muted-foreground/70">
            {phase === "completed"
              ? `Closed ${formatCampaignDate(campaign.closeDate)}`
              : phase === "active"
                ? `Until ${formatCampaignDate(campaign.closeDate)}`
                : `Opens ${formatCampaignDate(campaign.startDate)}`}
          </div>
        </dl>

        {/* CTA */}
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          nativeButton={false}
          render={
            <Link href={`/campaign/${campaign.slug}/poem`}>
              <BookOpen className="size-4" aria-hidden="true" />
              Read the full poem
              <ArrowRight className="size-3.5 ml-auto" aria-hidden="true" />
            </Link>
          }
        />
      </div>
    </li>
  )
}
