import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CampaignDirectory } from "@/components/campaign-directory"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Directory intro */}
        <section
          aria-labelledby="home-heading"
          className="border-b border-border/60"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16 text-center sm:py-20">
            <p className="mb-3 text-sm font-medium tracking-wide text-primary uppercase">
              The collective poetry project
            </p>
            <h1
              id="home-heading"
              className="mx-auto max-w-3xl font-serif text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
            >
              Two lines from you. One poem for every cause.
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
              Discover campaigns for the causes that matter, then add your two
              lines to a living poem written by the whole world.
            </p>
          </div>
        </section>

        {/* Campaign directory */}
        <div className="mx-auto w-full max-w-6xl px-6 py-12 sm:py-16">
          <CampaignDirectory />
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
