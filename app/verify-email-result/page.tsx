'use client'

import { useSearchParams } from 'next/navigation'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function VerificationResultPage() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || 'Processing...'
  const campaignId = searchParams.get('campaignId')
  const isError = searchParams.get('error') !== null

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md text-center" size="default">
        <CardContent className="flex flex-col items-center gap-4 py-10">
          {isError ? (
            <AlertCircle
              className="size-12 text-destructive"
              aria-hidden="true"
            />
          ) : (
            <CheckCircle2 className="size-12 text-primary" aria-hidden="true" />
          )}
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-semibold text-balance">
              {isError ? 'Verification Failed' : 'Email Verified!'}
            </h1>
            <p className="leading-relaxed text-muted-foreground text-pretty">
              {message}
            </p>
          </div>
          <Button
            onClick={() => {
              if (campaignId) {
                window.location.href = `/campaign/${campaignId}`
              } else {
                window.location.href = '/'
              }
            }}
          >
            {campaignId ? 'Back to Campaign' : 'Go Home'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
