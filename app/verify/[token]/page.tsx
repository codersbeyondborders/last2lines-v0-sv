import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { VerifyClient } from "@/components/verify-client"

export const metadata = {
  title: "Confirm your submission — Last2Lines",
}

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16 sm:px-6">
        <VerifyClient token={token} />
      </main>
      <SiteFooter />
    </div>
  )
}
