import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, PenLine } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { FullPoemView } from "@/components/full-poem-view"
import { Button } from "@/components/ui/button"
import { getCampaignPhase, formatCampaignDate } from "@/lib/mock-data"
import {
  getCampaignBySlug,
  getApprovedContributions,
  getSeedCouplets,
} from "@/lib/queries"

export const revalidate = 30

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const campaign = await getCampaignBySlug(slug)
  if (!campaign) return { title: "Poem not found — Last2Lines" }
  return {
    title: `Full poem: ${campaign.title} — Last2Lines`,
    description: `Read every couplet of "${campaign.title}" — a collective poem built line by line from voices around the world.`,
  }
}

export default async function FullPoemPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const campaign = await getCampaignBySlug(slug)
  if (!campaign) notFound()

  const phase = getCampaignPhase(campaign)
  const isOpen = phase === "active"

  const [contributions, seedCouplets] = await Promise.all([
    getApprovedContributions(campaign.id),
    getSeedCouplets(campaign.id),
  ])

  const allCouplets = [
    ...seedCouplets.map((seed, i) => ({
      id: seed.id,
      campaignId: campaign.id,
      sequenceNumber: i + 1,
      lineOne: seed.lineOne,
      lineTwo: seed.lineTwo,
      authorId: "seed",
      authorName: seed.author,
      authorEmail: "",
      country: null,
      status: "approved" as const,
      moderationReason: null,
      createdAt: new Date(0).toISOString(),
      isSeed: true,
    })),
    ...contributions.map((c) => ({ ...c, isSeed: false })),
  ]

  const totalLines = allCouplets.length * 2
  const authorSet = new Set(
    contributions.map((c) => c.authorName?.trim() || c.authorId),
  )
  const authorCount = Math.max(authorSet.size, contributions.length > 0 ? 1 : 0)

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero banner */}
        <section
          aria-labelledby="poem-hero-heading"
          className="relative isolate overflow-hidden"
        >
          <div className="relative min-h-[20rem] w-full sm:min-h-[24rem]">
            <Image
              src={campaign.backgroundImageUrl || "/placeholder.svg"}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30"
              aria-hidden="true"
            />
            <div className="relative z-10 mx-auto flex min-h-[20rem] w-full max-w-5xl flex-col justify-end px-6 py-10 sm:min-h-[24rem] sm:py-12">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Full poem
                </span>
                <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white/90 backdrop-blur-sm">
                  {phase === "active"
                    ? `Open until ${formatCampaignDate(campaign.closeDate)}`
                    : phase === "upcoming"
                      ? `Opens ${formatCampaignDate(campaign.startDate)}`
                      : `Closed ${formatCampaignDate(campaign.closeDate)}`}
                </span>
              </div>
              <h1
                id="poem-hero-heading"
                className="max-w-3xl font-serif text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl"
              >
                {campaign.title}
              </h1>
              <p className="mt-2 max-w-2xl text-base leading-relaxed text-white/85 text-pretty sm:text-lg">
                {campaign.tagline}
              </p>
            </div>
          </div>
        </section>

        {/* Campaign images gallery */}
        {campaign.campaignImages && campaign.campaignImages.length > 0 && (
          <section aria-label="Campaign images" className="border-b border-border">
            <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {campaign.campaignImages.map((img, i) => (
                  <div
                    key={i}
                    className="relative h-32 w-48 shrink-0 overflow-hidden rounded-xl border border-border"
                  >
                    <Image
                      src={img}
                      alt={`${campaign.title} image ${i + 1}`}
                      fill
                      sizes="192px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Description + stats */}
        <section aria-labelledby="about-heading" className="border-b border-border">
          <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-12">
            <div className="grid gap-10 lg:grid-cols-[1fr_auto]">
              <div>
                <h2
                  id="about-heading"
                  className="font-serif text-xl font-semibold"
                >
                  About this poem
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground text-pretty max-w-2xl">
                  {campaign.description}
                </p>
              </div>
              <dl className="grid grid-cols-3 gap-3 self-start lg:grid-cols-1 lg:w-44">
                {[
                  { label: "Couplets", value: allCouplets.length },
                  { label: "Lines", value: totalLines },
                  { label: "Authors", value: authorCount },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl border border-border bg-card px-4 py-4 text-center"
                  >
                    <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                      {s.label}
                    </dt>
                    <dd className="mt-1 font-serif text-2xl font-semibold tabular-nums">
                      {s.value.toLocaleString()}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* Full poem with search */}
        <section
          aria-labelledby="full-poem-heading"
          className="border-b border-border"
        >
          <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
            <h2
              id="full-poem-heading"
              className="mb-8 text-center font-serif text-2xl font-semibold text-balance sm:text-3xl"
            >
              {campaign.title}
            </h2>
            <FullPoemView
              couplets={allCouplets}
              campaignSlug={campaign.slug}
              campaignTitle={campaign.title}
              isOpen={isOpen}
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
