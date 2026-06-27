import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Faq } from "@/components/faq"
import { HowItWorks } from "@/components/how-it-works"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "About · Last2Lines",
  description:
    "Last2Lines is a collective poetry platform where anyone can add two lines to a shared campaign poem. Learn how it works for contributors and partners.",
}


export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <section
          aria-labelledby="about-heading"
          className="border-b border-border/60"
        >
          <div className="mx-auto w-full max-w-3xl px-6 py-16 text-center sm:py-20">
            <p className="mb-3 text-sm font-medium uppercase tracking-wide text-primary">
              About Last2Lines
            </p>
            <h1
              id="about-heading"
              className="font-serif text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
            >
              A peaceful sanctuary for collective human sentiment.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground text-pretty">
              Last2Lines is an award-winning digital campaigning platform that
              invites anyone to contribute exactly two lines of free verse to a
              shared campaign poem — turning thousands of isolated voices into a
              single, living tapestry of human solidarity.
            </p>
          </div>
        </section>

        {/* ── Why two lines ────────────────────────────────────────────────── */}
        <section
          aria-labelledby="why-heading"
          className="border-b border-border/60"
        >
          <div className="mx-auto w-full max-w-5xl px-6 py-14 sm:py-18">
            <h2
              id="why-heading"
              className="font-serif text-3xl font-semibold tracking-tight text-balance"
            >
              Why two lines?
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty">
              Traditional petitions collect clicks; Last2Lines collects voices.
              The two-line constraint removes the intimidation of writing a full
              poem, forces contributors to distil raw feeling into something
              precise, and structurally connects every couplet to the ones
              around it — you are never standing alone.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                {
                  title: "Radical inclusivity",
                  body: "Two lines take moments to write. You don't need to be a poet — you just need something to say.",
                },
                {
                  title: "The art of distillation",
                  body: "A 100-character limit turns reactionary outrage into considered, high-impact expression.",
                },
                {
                  title: "A unified canvas",
                  body: "Instead of disconnected comments, every couplet is stitched into one continuous collective poem.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl border border-border/60 bg-muted/30 p-6"
                >
                  <h3 className="text-sm font-semibold text-foreground">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground text-pretty">{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────────────── */}
        <HowItWorks />

        {/* ── Mission (short) ──────────────────────────────────────────────── */}
        <section
          aria-labelledby="mission-heading"
          className="border-b border-border/60"
        >
          <div className="mx-auto w-full max-w-3xl px-6 py-14 text-center sm:py-18">
            <h2
              id="mission-heading"
              className="font-serif text-3xl font-semibold tracking-tight text-balance"
            >
              Our mission
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground text-pretty">
              To democratise social advocacy by lowering the barrier to
              expression — using creative technology to fuse individual poetic
              voices into a singular, continuous, global chorus for social good.
              Whether you are an artist, an activist, or simply someone who
              cares, your voice has a specific place in the thread.
            </p>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────────── */}
        <Faq />

      </main>

      <SiteFooter />
    </div>
  )
}
