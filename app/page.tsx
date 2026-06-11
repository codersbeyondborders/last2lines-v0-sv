import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Hero } from "@/components/hero"
import { LivePoem } from "@/components/live-poem"
import { SubmissionForm } from "@/components/submission-form"
import { FLAGSHIP_CAMPAIGN } from "@/lib/mock-data"

export default function Home() {
  const campaign = FLAGSHIP_CAMPAIGN

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        <Hero campaign={campaign} />

        <LivePoem />

        <section
          id="contribute"
          aria-labelledby="contribute-heading"
          className="border-t border-border/60"
        >
          <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-20">
            <div className="mb-10 text-center">
              <h2
                id="contribute-heading"
                className="font-serif text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
              >
                Add your two lines
              </h2>
              <p className="mx-auto mt-3 max-w-xl leading-relaxed text-muted-foreground text-pretty">
                Every couplet passes an AI moderation check for the campaign
                theme before it joins the poem.
              </p>
            </div>
            <SubmissionForm />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
