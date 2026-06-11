import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Heart, PlayCircle } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CampaignHero } from "@/components/campaign-hero"
import { CampaignSubmission } from "@/components/campaign-submission"
import { CampaignPoem } from "@/components/campaign-poem"
import { Button } from "@/components/ui/button"
import {
  MOCK_CAMPAIGNS,
  getCampaignBySlug,
  getCampaignPhase,
  getCampaignStats,
  getApprovedContributions,
  formatCampaignDate,
} from "@/lib/mock-data"

export function generateStaticParams() {
  return MOCK_CAMPAIGNS.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const campaign = getCampaignBySlug(slug)
  if (!campaign) return { title: "Campaign not found — Last2Lines" }
  return {
    title: `${campaign.title} — Last2Lines`,
    description: campaign.tagline,
  }
}

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const campaign = getCampaignBySlug(slug)
  if (!campaign) notFound()

  const phase = getCampaignPhase(campaign)
  const stats = getCampaignStats(campaign)
  const couplets = getApprovedContributions(campaign.id)

  const statItems = [
    { label: "Voice", value: "1" },
    { label: "Authors", value: stats.contributors.toLocaleString() },
    { label: "Lines", value: stats.lines.toLocaleString() },
  ]

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <CampaignHero campaign={campaign} phase={phase} />

        {/* Back link + stats */}
        <section className="border-b border-border">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              All campaigns
            </Link>
            <dl className="mt-6 grid grid-cols-3 gap-4">
              {statItems.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl border border-border bg-card px-4 py-5 text-center"
                >
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    {s.label}
                  </dt>
                  <dd className="mt-1 font-serif text-2xl font-semibold tabular-nums sm:text-3xl">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* About + instructions */}
        <section
          aria-labelledby="about-heading"
          className="border-b border-border"
        >
          <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
            <article>
              <h2
                id="about-heading"
                className="font-serif text-2xl font-semibold text-balance sm:text-3xl"
              >
                About this campaign
              </h2>
              <p className="mt-4 leading-relaxed text-muted-foreground text-pretty">
                {campaign.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {campaign.videoLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={false}
                    render={
                      <a
                        href={campaign.videoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <PlayCircle className="size-4" aria-hidden="true" />
                        Watch the film
                      </a>
                    }
                  />
                )}
                {campaign.donationLink && (
                  <Button
                    size="sm"
                    nativeButton={false}
                    render={
                      <a
                        href={campaign.donationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Heart className="size-4" aria-hidden="true" />
                        Support the cause
                      </a>
                    }
                  />
                )}
              </div>
            </article>

            <aside aria-labelledby="how-heading">
              <h3
                id="how-heading"
                className="font-serif text-lg font-semibold"
              >
                How to contribute
              </h3>
              <ol className="mt-4 space-y-3">
                {campaign.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed">
                    <span
                      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                      aria-hidden="true"
                    >
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground text-pretty">
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
              <p className="mt-6 text-xs text-muted-foreground">
                {phase === "upcoming"
                  ? `Opens ${formatCampaignDate(campaign.startDate)}`
                  : phase === "completed"
                    ? `Closed ${formatCampaignDate(campaign.closeDate)}`
                    : `Open until ${formatCampaignDate(campaign.closeDate)}`}
              </p>
            </aside>
          </div>
        </section>

        {/* Contribution form */}
        <section
          id="contribute"
          aria-labelledby="contribute-heading"
          className="scroll-mt-20 border-b border-border bg-muted/30"
        >
          <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="mb-8 text-center">
              <h2
                id="contribute-heading"
                className="font-serif text-2xl font-semibold text-balance sm:text-3xl"
              >
                Add your two lines
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground text-pretty">
                Your couplet becomes a permanent verse in this living poem.
              </p>
            </div>
            <CampaignSubmission campaign={campaign} phase={phase} />
          </div>
        </section>

        {/* Living poem */}
        <section
          id="poem"
          aria-labelledby="poem-heading"
          className="scroll-mt-20"
        >
          <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
            <div className="mb-8 text-center">
              <h2
                id="poem-heading"
                className="font-serif text-2xl font-semibold text-balance sm:text-3xl"
              >
                The Living Poem
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground text-pretty">
                {stats.couplets.toLocaleString()} couplets, stitched into one
                continuous voice.
              </p>
            </div>
            <CampaignPoem couplets={couplets} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
