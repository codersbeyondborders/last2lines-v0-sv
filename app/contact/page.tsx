import type { Metadata } from "next"
import { Mail } from "lucide-react"
import Link from "next/link"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { ContactForm } from "@/components/contact-form"

export const metadata: Metadata = {
  title: "Contact · Last2Lines",
  description:
    "Request a new campaign, share feedback, raise a concern, or just say hello.",
}

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section
          aria-labelledby="contact-heading"
          className="border-b border-border/60"
        >
          <div className="mx-auto w-full max-w-3xl px-6 py-16 text-center sm:py-20">
            <p className="mb-3 text-sm font-medium tracking-wide text-primary uppercase">
              Get in touch
            </p>
            <h1
              id="contact-heading"
              className="font-serif text-4xl font-semibold tracking-tight text-balance sm:text-5xl"
            >
              We&apos;d love to hear from you.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
              Request a campaign, share feedback, raise a concern, or simply say
              hello. Choose a category below and we&apos;ll get back to you.
            </p>
          </div>
        </section>

        {/* Form + sidebar */}
        <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-16">
          <div className="flex flex-col gap-10 lg:flex-row lg:gap-16">
            {/* Form (main column) */}
            <div className="min-w-0 flex-1">
              <ContactForm />
            </div>

            {/* Sidebar — direct channels */}
            <aside
              aria-label="Direct contact channels"
              className="flex flex-col gap-4 lg:w-64 lg:shrink-0"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Other ways to reach us
              </p>

              <Link
                href="mailto:last2lines@gmail.com"
                className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Mail
                  className="mt-0.5 size-5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">Email</p>
                  <p className="mt-0.5 break-all text-xs text-muted-foreground">
                    last2lines@gmail.com
                  </p>
                </div>
              </Link>

              <Link
                href="https://github.com/codersbeyondborders/last2lines-v0-sv"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="mt-0.5 size-5 shrink-0 text-primary"
                  aria-hidden="true"
                >
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-foreground">GitHub</p>
                  <p className="mt-0.5 break-all text-xs text-muted-foreground">
                    codersbeyondborders/last2lines-v0-sv
                  </p>
                </div>
              </Link>

              <div className="mt-2 rounded-lg border border-border/40 bg-muted/30 px-4 py-3">
                <p className="text-xs leading-relaxed text-muted-foreground text-pretty">
                  We aim to respond to all messages within 2–3 business days.
                  For urgent content concerns, please use the Concern tab.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
