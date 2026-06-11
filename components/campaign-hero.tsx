"use client"

import { useEffect, useState } from "react"
import type { Campaign, CampaignPhase } from "@/lib/mock-data"

const PHASE_LABEL: Record<CampaignPhase, string> = {
  active: "Active Now",
  upcoming: "Upcoming",
  completed: "Completed",
}

export function CampaignHero({
  campaign,
  phase,
}: {
  campaign: Campaign
  phase: CampaignPhase
}) {
  const images =
    campaign.campaignImages.length > 0
      ? campaign.campaignImages
      : [campaign.backgroundImageUrl]
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % images.length)
    }, 5000)
    return () => window.clearInterval(id)
  }, [images.length])

  return (
    <section
      aria-labelledby="campaign-hero-heading"
      className="relative isolate overflow-hidden"
    >
      <div className="relative min-h-[24rem] w-full sm:min-h-[28rem]">
        {images.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${src}-${i}`}
            src={src || "/placeholder.svg"}
            alt=""
            aria-hidden={i !== active}
            className={`absolute inset-0 size-full object-cover transition-opacity duration-1000 ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        {/* Dark overlay for text contrast (WCAG) */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/35"
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto flex min-h-[24rem] w-full max-w-6xl flex-col justify-end px-6 py-10 sm:min-h-[28rem] sm:py-14">
          <span className="mb-4 inline-flex w-fit items-center rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            {PHASE_LABEL[phase]}
          </span>
          <h1
            id="campaign-hero-heading"
            className="max-w-3xl font-serif text-4xl font-semibold tracking-tight text-balance text-white sm:text-5xl"
          >
            {campaign.title}
          </h1>
          <p className="mt-3 max-w-2xl text-lg leading-relaxed text-white/85 text-pretty">
            {campaign.tagline}
          </p>
        </div>

        {images.length > 1 ? (
          <div
            className="absolute bottom-4 right-6 z-10 flex gap-2"
            role="tablist"
            aria-label="Campaign images"
          >
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={`Show image ${i + 1}`}
                onClick={() => setActive(i)}
                className={`size-2.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40 ${
                  i === active ? "bg-white" : "bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
