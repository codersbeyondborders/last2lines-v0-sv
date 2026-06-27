import { Suspense } from "react"
import type { Metadata } from "next"
import { getContactSubmissions } from "@/lib/queries"
import { ContactSubmissionsTable } from "@/components/admin/contact-submissions-table"
import { PageHeader } from "@/components/admin/page-header"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "Contact Submissions | Last2Lines Admin",
}

const PAGE_SIZE = 20

interface PageProps {
  searchParams: Promise<{ status?: string; type?: string; page?: string }>
}

export default async function ContactSubmissionsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const status  = (params.status as "new" | "read" | "archived" | "all") || "all"
  const type    = params.type  || "all"
  const page    = Math.max(1, Number(params.page) || 1)

  const { items, total } = await getContactSubmissions({
    status,
    type,
    page,
    limit: PAGE_SIZE,
  })

  // Unread count for the page subtitle
  const { total: newCount } = await getContactSubmissions({ status: "new", limit: 1 })

  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader
        title="Contact Submissions"
        description={
          newCount > 0
            ? `${newCount} unread submission${newCount === 1 ? "" : "s"}`
            : "All submissions up to date."
        }
      />

      <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
        <ContactSubmissionsTable
          initialItems={items}
          total={total}
          currentPage={page}
          pageSize={PAGE_SIZE}
          initialStatus={status}
          initialType={type}
        />
      </Suspense>
    </main>
  )
}
