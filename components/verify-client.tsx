"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { CheckCircle2, AlertCircle, Clock, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { verifyContribution, type VerifyResult } from "@/lib/actions"

/**
 * Runs the verification server action once on mount. The action is invoked
 * from the client (not during a server render) so its revalidatePath calls
 * are valid. Shows loading, then a result state.
 */
export function VerifyClient({ token }: { token: string }) {
  const [result, setResult] = useState<VerifyResult | null>(null)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    verifyContribution(token)
      .then(setResult)
      .catch(() =>
        setResult({
          ok: false,
          error: "Something went wrong while confirming your submission.",
        }),
      )
  }, [token])

  if (!result) {
    return (
      <Card className="mx-auto w-full max-w-xl text-center" size="default">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          <Loader2
            className="size-10 animate-spin text-primary"
            aria-hidden="true"
          />
          <p
            className="leading-relaxed text-muted-foreground"
            aria-live="polite"
          >
            Confirming your submission…
          </p>
        </CardContent>
      </Card>
    )
  }

  let icon = <CheckCircle2 className="size-12 text-primary" aria-hidden="true" />
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
  )
}
