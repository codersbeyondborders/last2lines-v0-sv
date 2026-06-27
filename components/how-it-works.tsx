// Shared "How it works" section used on both the homepage and the about page.
// Contains the FlowDiagram primitive and both step datasets so neither page
// duplicates the data.

interface Step {
  n: number
  label: string
  sub: string
}

function FlowDiagram({ steps }: { steps: Step[] }) {
  return (
    <ol
      className="relative flex flex-col gap-0 sm:flex-row"
      aria-label="Process steps"
    >
      {steps.map((step, i) => (
        <li key={step.n} className="flex flex-1 flex-col sm:items-center">
          <div className="flex items-start sm:flex-col sm:items-center sm:w-full">
            <div className="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-sm font-semibold text-primary">
              {step.n}
            </div>
            {i < steps.length - 1 && (
              <>
                <div
                  className="ml-5 mt-0 h-full w-px bg-border sm:hidden"
                  aria-hidden="true"
                />
                <div
                  className="hidden sm:block flex-1 h-px w-full bg-border mt-5 -mx-1"
                  aria-hidden="true"
                />
              </>
            )}
          </div>
          <div className="ml-14 -mt-10 pb-8 sm:ml-0 sm:mt-4 sm:pb-0 sm:px-3 sm:text-center">
            <p className="text-sm font-semibold text-foreground">{step.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground text-pretty">
              {step.sub}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

const CONTRIBUTOR_STEPS: Step[] = [
  {
    n: 1,
    label: "Find a campaign",
    sub: "Browse active campaigns on the homepage and choose one that resonates with you.",
  },
  {
    n: 2,
    label: "Write two lines",
    sub: "Compose one couplet of free verse — up to 100 characters per line. No poetry experience needed.",
  },
  {
    n: 3,
    label: "Submit",
    sub: "Enter your name (optional) and email, then hit submit. No account required.",
  },
  {
    n: 4,
    label: "Review",
    sub: "A moderator (with AI pre-screening) reviews your couplet, usually within 24 hours.",
  },
  {
    n: 5,
    label: "Join the poem",
    sub: "Your approved lines are stitched into the living poem, right after the previous contributor.",
  },
]

const PARTNER_STEPS: Step[] = [
  {
    n: 1,
    label: "Contact us",
    sub: "Use the Contact page to request a campaign — tell us your cause, timeline, and goals.",
  },
  {
    n: 2,
    label: "Campaign setup",
    sub: "We create a dedicated page with your theme, seed couplets, and moderation settings.",
  },
  {
    n: 3,
    label: "Go live",
    sub: "Your campaign opens for public contributions. The poem grows in real time.",
  },
  {
    n: 4,
    label: "Moderation",
    sub: "Every submission is screened by AI and reviewed by a human moderator.",
  },
  {
    n: 5,
    label: "Share the poem",
    sub: "When the campaign closes, you get a finished collective poem to publish and amplify.",
  },
]

export function HowItWorks() {
  return (
    <>
      {/* For public contributors */}
      <section
        aria-labelledby="hw-contributors-heading"
        className="border-b border-border/60"
      >
        <div className="mx-auto w-full max-w-5xl px-6 py-14 sm:py-18">
          <div className="mb-10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
              For public contributors
            </p>
            <h2
              id="hw-contributors-heading"
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

      {/* For partners and organisations */}
      <section
        aria-labelledby="hw-partners-heading"
        className="border-b border-border/60 bg-muted/20"
      >
        <div className="mx-auto w-full max-w-5xl px-6 py-14 sm:py-18">
          <div className="mb-10">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">
              For partners and organisations
            </p>
            <h2
              id="hw-partners-heading"
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
    </>
  )
}
