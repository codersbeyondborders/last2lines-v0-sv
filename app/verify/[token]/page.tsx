import Link from "next/link"
import { CheckCircle2, AlertCircle, Clock, XCircle } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { verifyContribution } from "@/lib/actions"

// The verification step writes to the database, so never prerender it.
export const dynamic = "force-dynamic"

export const metadata = {
  title: "Confirm your submission — Last2Lines",
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const result = await verifyContribution(token)

  let icon = (
    <CheckCircle2 className="size-12 text-primary" aria-hidden="true" />
  )
  let title = "Email confirmed"
  let body =
    "Thanks for confirming. Your couplet has been verified and is now being processed."
  let showPoemLink = false

  if (!result.ok) {
    icon = <AlertCircle className="size-12 text-destructive" aria-hidden="true" />
    title = "We couldn't confirm this link"
    body =
      result.error ??
      "This verification link is invalid or has already been used."
  } else if (result.status === "approved") {
    icon = <CheckCircle2 className="size-12 text-primary" aria-hidden="true" />
    title = "Your couplet is live"
    body = `Your email is confirmed and your couplet has been published${
      result.campaignTitle ? ` in "${result.campaignTitle}"` : ""
    }. Thank you for adding your voice.`
    showPoemLink = true
  } else if (result.status === "rejected") {
    icon = <XCircle className="size-12 text-muted-foreground" aria-hidden="true" />
    title = "Email confirmed, but your couplet wasn't approved"
    body =
      "Thanks for confirming your email. Our moderation check found this couplet fell outside the campaign guidelines, so it wasn't added to the poem. You're welcome to submit a new one."
    showPoemLink = true
  } else {
    icon = <Clock className="size-12 text-primary" aria-hidden="true" />
    title = "Email confirmed — review pending"
    body =
      "Thanks for confirming your email. Your couplet is now queued for review and will join the poem once it's approved."
    showPoemLink = true
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <Card className="mx-auto w-full max-w-xl text-center" size="default">
          <CardContent className="flex flex-col items-center gap-4 py-10">
            {icon}
            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-semibold text-balance">
                {title}
              </h1>
              <p
                className="leading-relaxed text-muted-foreground text-pretty"
                aria-live="polite"
              >
                {body}
              </p>
            </div>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              {showPoemLink && result.campaignSlug ? (
                <Button
                  nativeButton={false}
                  render={
                    <Link href={`/campaign/${result.campaignSlug}#poem`}>
                      Read the poem
                    </Link>
                  }
                />
              ) : null}
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/">Back to campaigns</Link>}
              />
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  )
}
