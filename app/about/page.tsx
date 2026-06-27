import type { Metadata } from "next"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Faq } from "@/components/faq"

export const revalidate = 86400

export const metadata: Metadata = {
  title: "About · Last2Lines",
  description:
    "Last2Lines is a collective poetry platform where anyone can add two lines to a shared campaign poem. Learn how it works for contributors and partners.",
}

// ── Simple inline flow diagram ────────────────────────────────────────────────

interface Step {
  n: number
  label: string
  sub: string
}

function FlowDiagram({ steps }: { steps: Step[] }) {
  return (
    <ol className="relative flex flex-col gap-0 sm:flex-row" aria-label="Process steps">
      {steps.map((step, i) => (
        <li key={step.n} className="flex flex-1 flex-col sm:items-center">
          {/* connector line (left-side on mobile, top on desktop) */}
          <div className="flex items-start sm:flex-col sm:items-center sm:w-full">
            {/* circle */}
            <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-semibold text-primary">
              {step.n}
            </div>
            {/* line after (except last) */}
            {i < steps.length - 1 && (
              <>
                {/* mobile: vertical line */}
                <div className="ml-5 mt-0 h-full w-px bg-border sm:hidden" aria-hidden="true" />
                {/* desktop: horizontal line */}
                <div className="hidden sm:block flex-1 h-px w-full bg-border mt-5 -mx-1" aria-hidden="true" />
              </>
            )}
          </div>
          {/* label */}
          <div className="ml-14 -mt-10 pb-8 sm:ml-0 sm:mt-4 sm:pb-0 sm:px-3 sm:text-center">
            <p className="text-sm font-semibold text-foreground">{step.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground text-pretty">{step.sub}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

const CONTRIBUTOR_STEPS: Step[] = [
  { n: 1, label: "Find a campaign", sub: "Browse active campaigns on the homepage and choose one that resonates with you." },
  { n: 2, label: "Write two lines", sub: "Compose one couplet of free verse — up to 100 characters per line. No poetry experience needed." },
  { n: 3, label: "Submit", sub: "Enter your name (optional) and email, then hit submit. No account required." },
  { n: 4, label: "Review", sub: "A moderator (with AI pre-screening) reviews your couplet, usually within 24 hours." },
  { n: 5, label: "Join the poem", sub: "Your approved lines are stitched into the living poem, right after the previous contributor." },
]

const PARTNER_STEPS: Step[] = [
  { n: 1, label: "Contact us", sub: "Use the Contact page to request a campaign — tell us your cause, timeline, and goals." },
  { n: 2, label: "Campaign setup", sub: "We create a dedicated page with your theme, seed couplets, and moderation settings." },
  { n: 3, label: "Go live", sub: "Your campaign opens for public contributions. The poem grows in real time." },
  { n: 4, label: "Moderation", sub: "Every submission is screened by AI and reviewed by a human moderator." },
  { n: 5, label: "Share the poem", sub: "When the campaign closes, you get a finished collective poem to publish and amplify." },
]

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

        {/* ── How it works: Contributors ───────────────────────────────────── */}
        <section
          aria-labelledby="contributors-heading"
          className="border-b border-border/60"
        >
          <div className="mx-auto w-full max-w-5xl px-6 py-14 sm:py-18">
            <div className="mb-10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
                For public contributors
              </p>
              <h2
                id="contributors-heading"
                className="font-serif text-3xl font-semibold tracking-tight text-balance"
              >
                How to add your two lines
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">
                No account, no login, no prior poetry experience. Just find a
                cause you care about and write.
              </p>
            </div>
            <FlowDiagram steps={CONTRIBUTOR_STEPS} />
          </div>
        </section>

        {/* ── How it works: Partners ───────────────────────────────────────── */}
        <section
          aria-labelledby="partners-heading"
          className="border-b border-border/60 bg-muted/20"
        >
          <div className="mx-auto w-full max-w-5xl px-6 py-14 sm:py-18">
            <div className="mb-10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
                For partners and organisations
              </p>
              <h2
                id="partners-heading"
                className="font-serif text-3xl font-semibold tracking-tight text-balance"
              >
                Launch a campaign for your cause
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground text-pretty">
                We handle the platform; you bring the cause. From setup to a
                finished shareable poem, here is what the journey looks like.
              </p>
            </div>
            <FlowDiagram steps={PARTNER_STEPS} />

            <div className="mt-10 flex flex-wrap gap-3">
              <a
                href="/contact"
                className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Request a campaign
              </a>
              <a
                href="/contact"
                className="inline-flex items-center rounded-lg border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Ask a question
              </a>
            </div>
          </div>
        </section>

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
