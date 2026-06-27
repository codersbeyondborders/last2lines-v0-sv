"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { submitContactForm, type ContactType } from "@/lib/actions"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"

// ── Per-tab config ─────────────────────────────────────────────────────────

interface TabConfig {
  value: ContactType
  label: string
  heading: string
  description: string
  showCampaignName?: boolean
  showSubject?: boolean
  messagePlaceholder: string
  subjectPlaceholder?: string
}

const TABS: TabConfig[] = [
  {
    value: "campaign_request",
    label: "New Campaign",
    heading: "Request a Campaign",
    description:
      "Have a cause worth two lines? Tell us about the campaign you have in mind and we will be in touch.",
    showCampaignName: true,
    showSubject: false,
    messagePlaceholder:
      "Describe the campaign theme, the cause it supports, and why it matters…",
  },
  {
    value: "feedback",
    label: "Feedback",
    heading: "Share your Feedback",
    description:
      "Help us improve Last2Lines. What is working well? What could be better?",
    showSubject: true,
    subjectPlaceholder: "e.g. The contribution form experience",
    messagePlaceholder: "Your thoughts, suggestions, or ideas…",
  },
  {
    value: "concern",
    label: "Concern",
    heading: "Raise a Concern",
    description:
      "Noticed something inappropriate or have a privacy concern? Let us know and we will review it promptly.",
    showSubject: true,
    subjectPlaceholder: "e.g. Inappropriate content in campaign XYZ",
    messagePlaceholder: "Describe your concern in as much detail as you can…",
  },
  {
    value: "general",
    label: "General",
    heading: "Get in Touch",
    description:
      "A partnership enquiry, media request, or just want to say hello? We read every message.",
    showSubject: true,
    subjectPlaceholder: "What is this regarding?",
    messagePlaceholder: "Your message…",
  },
]

// ── Field state per tab ─────────────────────────────────────────────────────

interface FieldState {
  name: string
  email: string
  subject: string
  campaignName: string
  message: string
}

const EMPTY_FIELDS: FieldState = {
  name: "",
  email: "",
  subject: "",
  campaignName: "",
  message: "",
}

const MESSAGE_MAX = 2000

// ── Component ──────────────────────────────────────────────────────────────

export function ContactForm() {
  const [activeTab, setActiveTab] = useState<ContactType>("campaign_request")
  // One set of fields shared across all tabs (name/email persist; others reset on tab change).
  const [fields, setFields] = useState<FieldState>(EMPTY_FIELDS)
  const [errors, setErrors] = useState<Partial<FieldState>>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const config = TABS.find((t) => t.value === activeTab)!
  const charCount = fields.message.length
  const overLimit = charCount > MESSAGE_MAX

  function set(key: keyof FieldState, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function handleTabChange(val: string) {
    setActiveTab(val as ContactType)
    // Reset tab-specific fields but keep name + email for convenience.
    setFields((prev) => ({
      ...EMPTY_FIELDS,
      name: prev.name,
      email: prev.email,
    }))
    setErrors({})
    setServerError(null)
    setSuccess(false)
  }

  function validate(): boolean {
    const next: Partial<FieldState> = {}
    if (!fields.name.trim()) next.name = "Name is required."
    if (!fields.email.trim()) next.email = "Email is required."
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim()))
      next.email = "Enter a valid email address."
    if (config.showCampaignName && !fields.campaignName.trim())
      next.campaignName = "Campaign name is required."
    if (!fields.message.trim()) next.message = "Message is required."
    else if (fields.message.trim().length < 10)
      next.message = "Message must be at least 10 characters."
    else if (overLimit)
      next.message = `Message must be under ${MESSAGE_MAX} characters.`
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setServerError(null)

    startTransition(async () => {
      const result = await submitContactForm({
        type: activeTab,
        name: fields.name.trim(),
        email: fields.email.trim().toLowerCase(),
        subject: fields.subject.trim() || undefined,
        message: fields.message.trim(),
        campaignName: fields.campaignName.trim() || undefined,
      })
      if (result.ok) {
        setSuccess(true)
        setFields((prev) => ({
          ...EMPTY_FIELDS,
          name: prev.name,
          email: prev.email,
        }))
      } else {
        setServerError(result.error ?? "Something went wrong. Please try again.")
      }
    })
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      {/* Tab switcher */}
      <TabsList
        className="mb-8 grid w-full grid-cols-4"
        aria-label="Contact form type"
      >
        {TABS.map((t) => (
          <TabsTrigger key={t.value} value={t.value}>
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Each tab shares the same form; only headings + optional fields differ */}
      {TABS.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {success ? (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-accent/20 px-6 py-14 text-center"
            >
              <CheckCircle
                className="size-10 text-primary"
                aria-hidden="true"
              />
              <h2 className="font-serif text-xl font-semibold text-foreground">
                Message sent — thank you!
              </h2>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                We have received your{" "}
                {tab.value === "campaign_request"
                  ? "campaign request"
                  : tab.value}{" "}
                and will get back to you at{" "}
                <span className="font-medium text-foreground">
                  {fields.email ||
                    "the address you provided"}
                </span>{" "}
                as soon as possible.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSuccess(false)
                  setServerError(null)
                }}
              >
                Send another message
              </Button>
            </div>
          ) : (
            <form
              id={`contact-form-${tab.value}`}
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-6"
              aria-label={tab.heading}
            >
              <div className="flex flex-col gap-1">
                <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
                  {tab.heading}
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
                  {tab.description}
                </p>
              </div>

              {/* Server error */}
              {serverError && (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/8 px-4 py-3 text-sm text-destructive"
                >
                  <AlertCircle
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  {serverError}
                </div>
              )}

              {/* Name + Email */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`name-${tab.value}`}>
                    Your name <span aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id={`name-${tab.value}`}
                    name="name"
                    type="text"
                    autoComplete="name"
                    placeholder="Jane Smith"
                    value={fields.name}
                    onChange={(e) => set("name", e.target.value)}
                    aria-invalid={!!errors.name}
                    aria-describedby={
                      errors.name ? `name-error-${tab.value}` : undefined
                    }
                    disabled={isPending}
                  />
                  {errors.name && (
                    <p
                      id={`name-error-${tab.value}`}
                      role="alert"
                      className="text-xs text-destructive"
                    >
                      {errors.name}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`email-${tab.value}`}>
                    Email address <span aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id={`email-${tab.value}`}
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="jane@example.com"
                    value={fields.email}
                    onChange={(e) => set("email", e.target.value)}
                    aria-invalid={!!errors.email}
                    aria-describedby={
                      errors.email ? `email-error-${tab.value}` : undefined
                    }
                    disabled={isPending}
                  />
                  {errors.email && (
                    <p
                      id={`email-error-${tab.value}`}
                      role="alert"
                      className="text-xs text-destructive"
                    >
                      {errors.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Campaign name (request tab only) */}
              {tab.showCampaignName && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`campaign-name-${tab.value}`}>
                    Proposed campaign name <span aria-hidden="true">*</span>
                  </Label>
                  <Input
                    id={`campaign-name-${tab.value}`}
                    name="campaignName"
                    type="text"
                    placeholder="e.g. Voices for Clean Air"
                    value={fields.campaignName}
                    onChange={(e) => set("campaignName", e.target.value)}
                    aria-invalid={!!errors.campaignName}
                    aria-describedby={
                      errors.campaignName
                        ? `campaign-name-error-${tab.value}`
                        : undefined
                    }
                    disabled={isPending}
                  />
                  {errors.campaignName && (
                    <p
                      id={`campaign-name-error-${tab.value}`}
                      role="alert"
                      className="text-xs text-destructive"
                    >
                      {errors.campaignName}
                    </p>
                  )}
                </div>
              )}

              {/* Subject (optional for most tabs) */}
              {tab.showSubject && (
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`subject-${tab.value}`}>
                    Subject{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id={`subject-${tab.value}`}
                    name="subject"
                    type="text"
                    placeholder={tab.subjectPlaceholder}
                    value={fields.subject}
                    onChange={(e) => set("subject", e.target.value)}
                    disabled={isPending}
                  />
                </div>
              )}

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between">
                  <Label htmlFor={`message-${tab.value}`}>
                    Message <span aria-hidden="true">*</span>
                  </Label>
                  <span
                    aria-live="polite"
                    className={`text-xs tabular-nums ${
                      overLimit
                        ? "font-semibold text-destructive"
                        : "text-muted-foreground"
                    }`}
                  >
                    {charCount}/{MESSAGE_MAX}
                  </span>
                </div>
                <Textarea
                  id={`message-${tab.value}`}
                  name="message"
                  rows={6}
                  placeholder={tab.messagePlaceholder}
                  value={fields.message}
                  onChange={(e) => set("message", e.target.value)}
                  aria-invalid={!!errors.message || overLimit}
                  aria-describedby={
                    errors.message ? `message-error-${tab.value}` : undefined
                  }
                  disabled={isPending}
                  className={
                    overLimit ? "border-destructive focus-visible:ring-destructive/40" : ""
                  }
                />
                {errors.message && (
                  <p
                    id={`message-error-${tab.value}`}
                    role="alert"
                    className="text-xs text-destructive"
                  >
                    {errors.message}
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end pt-1">
                <Button
                  type="submit"
                  disabled={isPending || overLimit}
                  className="min-w-32"
                >
                  {isPending ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      Sending…
                    </>
                  ) : (
                    "Send message"
                  )}
                </Button>
              </div>
            </form>
          )}
        </TabsContent>
      ))}
    </Tabs>
  )
}
