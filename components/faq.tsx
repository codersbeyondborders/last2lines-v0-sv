"use client"

import { useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface FaqEntry {
  q: string
  a: string
}

interface FaqGroup {
  label: string
  items: FaqEntry[]
}

const FAQ_GROUPS: FaqGroup[] = [
  {
    label: "About Last2Lines",
    items: [
      {
        q: "What is Last2Lines?",
        a: "Last2Lines is a collective poetry platform where anyone can contribute exactly two lines of free verse to a shared, living poem built around a cause. Every approved couplet is stitched together into one continuous tapestry of human voices.",
      },
      {
        q: "Do I need an account to contribute?",
        a: "No account is required. You simply provide your name (optional) and an email address when you submit your two lines. Your email is only used to tie contributions to a single author and is never shared or sold.",
      },
      {
        q: "Can I see the full poem?",
        a: "Yes. Every campaign page shows the full, continuously growing poem made from all approved couplets, in the order they were accepted.",
      },
      {
        q: "Who owns the lines I write?",
        a: "You do. Copyright of your individual couplet stays with you. By submitting you grant Last2Lines a perpetual, royalty-free licence to publish and display your lines as part of the collective poem, across any media channel.",
      },
    ],
  },
  {
    label: "How it works — contributors",
    items: [
      {
        q: "How do I contribute my two lines?",
        a: "Find a campaign on the homepage that resonates with you, open its page, and click \"Write Your Lines\". Enter your two lines of free verse, add your name and email, then submit. That is all — no sign-up, no login, no previous poetry experience needed.",
      },
      {
        q: "What makes a good couplet?",
        a: "Authenticity beats polish. Keep each line under 100 characters, stay close to the campaign theme, and say what you actually feel. You don't need to be a poet — the constraint of two lines is the whole point.",
      },
      {
        q: "Can I submit to multiple campaigns?",
        a: "Yes. Each campaign is independent. You can contribute two lines to as many active campaigns as you like — each couplet joins that campaign's specific poem.",
      },
      {
        q: "How do I know if my lines were accepted?",
        a: "If the campaign has email notifications enabled, you will receive a confirmation email once your couplet is approved by a moderator. You can also revisit the campaign page at any time — approved lines appear in the living poem.",
      },
      {
        q: "Can I edit or delete my contribution after submitting?",
        a: "Contributions cannot be edited after submission because the poem is a collective, append-only record. If you have a genuine concern about a published couplet, please reach out via the Contact page and we will review it.",
      },
    ],
  },
  {
    label: "How it works — partners",
    items: [
      {
        q: "What is a campaign partner?",
        a: "A campaign partner is an organisation, charity, NGO, or individual that sponsors or co-creates a Last2Lines campaign. Partners provide the cause, the framing, and sometimes seed couplets. In return, the finished poem — and the community behind it — amplifies their message.",
      },
      {
        q: "How do I request a new campaign for my cause?",
        a: "Use the Contact page and select \"Request a new campaign\". Tell us about your cause, the audience you want to reach, and any key dates. Our team will get back to you within a few working days to discuss setup, timeline, and editorial guidelines.",
      },
      {
        q: "What does the campaign setup process look like?",
        a: "Once agreed, we create a dedicated campaign page with your branding guidelines, upload seed couplets if provided, configure moderation settings, and set a start and close date. You get a preview link before it goes live. After the campaign closes, we can generate a printable or shareable version of the full poem.",
      },
      {
        q: "Is there a cost for partners?",
        a: "Last2Lines is an independent creative project. Some campaigns are run pro-bono for non-profits and community causes; others are sponsored partnerships. Please reach out via the Contact page to discuss what works for your organisation.",
      },
      {
        q: "Can partners moderate their campaign?",
        a: "Partners can define content guidelines and flag concerns. Final moderation decisions rest with the Last2Lines team to maintain editorial independence and platform integrity.",
      },
    ],
  },
  {
    label: "AI and moderation",
    items: [
      {
        q: "How does moderation work?",
        a: "Every submission passes through a hybrid moderation process — an AI model screens for policy violations (spam, hate speech, off-theme content), and human moderators make final calls. We aim to be fair and fast; most couplets are reviewed within 24 hours.",
      },
      {
        q: "How do we use AI?",
        a: "We use AI in two ways: first, as a first-pass content filter that automatically flags submissions that violate platform guidelines before a human reviews them. Second, campaign organisers can optionally enable stricter AI-assisted thematic scoring to keep a campaign's poem focused. AI never publishes or rejects a couplet autonomously — a human moderator always makes the final decision.",
      },
      {
        q: "Does AI write any of the poetry?",
        a: "No. Every line in a Last2Lines poem is written by a real human contributor. AI is only used as a moderation assistant, never as an author or co-author.",
      },
      {
        q: "How do you prevent spam or abuse?",
        a: "Submissions are rate-limited per email address. The AI layer catches obvious spam patterns instantly. Human moderators review every couplet before it appears in the public poem. Repeat offenders can be blocked from future submissions.",
      },
    ],
  },
  {
    label: "Contact and support",
    items: [
      {
        q: "How do I contact Last2Lines?",
        a: "Visit the Contact page and choose the type of enquiry: general question, feedback, concern, or a new campaign request. Fill in the form and we will respond within two to three working days.",
      },
      {
        q: "I found a couplet that seems offensive or off-topic. What do I do?",
        a: "Use the Contact page and select \"Concern\". Include the campaign name and, if possible, a brief description of the couplet in question. Our moderation team will review it promptly.",
      },
      {
        q: "How can I stay up to date with new campaigns?",
        a: "Check the homepage for the latest active campaigns. You can also follow our social channels, or submit a General Contact message asking to be added to our infrequent newsletter.",
      },
    ],
  },
]

interface FaqItemProps {
  q: string
  a: string
}

function FaqItem({ q, a }: FaqItemProps) {
  const [open, setOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div className="border-b border-border/60 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-left text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-base"
      >
        <span>{q}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className={cn(
            "shrink-0 text-muted-foreground transition-transform duration-300",
            open && "rotate-180",
          )}
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        ref={contentRef}
        style={{
          maxHeight: open ? contentRef.current?.scrollHeight : 0,
          overflow: "hidden",
          transition: "max-height 0.35s ease",
        }}
      >
        <p className="pb-5 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {a}
        </p>
      </div>
    </div>
  )
}

export function Faq() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null)

  const visibleGroups =
    activeGroup === null
      ? FAQ_GROUPS
      : FAQ_GROUPS.filter((g) => g.label === activeGroup)

  return (
    <section
      aria-labelledby="faq-heading"
      className="border-t border-border/60 bg-background"
    >
      <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:py-24">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[2fr_3fr] lg:gap-16">
          {/* Left — heading + category filter */}
          <div className="lg:pt-2">
            <h2
              id="faq-heading"
              className="font-serif text-4xl font-semibold tracking-tight text-balance leading-tight sm:text-5xl"
            >
              Frequently
              <br />
              Asked
              <br />
              Questions
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground text-pretty">
              Still have questions?{" "}
              <a
                href="/contact"
                className="text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
              >
                Get in touch
              </a>
              .
            </p>

            {/* Category pills */}
            <nav
              aria-label="FAQ categories"
              className="mt-8 flex flex-wrap gap-2 lg:flex-col lg:gap-1.5"
            >
              <button
                type="button"
                onClick={() => setActiveGroup(null)}
                aria-pressed={activeGroup === null}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  activeGroup === null
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted",
                )}
              >
                All topics
              </button>
              {FAQ_GROUPS.map((g) => (
                <button
                  key={g.label}
                  type="button"
                  onClick={() =>
                    setActiveGroup((prev) =>
                      prev === g.label ? null : g.label,
                    )
                  }
                  aria-pressed={activeGroup === g.label}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    activeGroup === g.label
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  {g.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right — grouped accordion */}
          <div aria-live="polite">
            {visibleGroups.map((group) => (
              <div key={group.label} className="mb-10 last:mb-0">
                <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
                  {group.label}
                </p>
                <div className="border-t border-border/60">
                  {group.items.map((faq) => (
                    <FaqItem key={faq.q} q={faq.q} a={faq.a} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
