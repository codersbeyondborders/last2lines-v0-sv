import { PageHeader } from "@/components/admin/page-header"
import { AuthorsTable } from "@/components/admin/authors-table"
import { getAuthors, getAuthorFilterOptions, getSubmissionCounts } from "@/lib/queries"

// Prevent prerendering; this page requires database queries
export const dynamic = "force-dynamic"

export default async function AuthorsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; campaign?: string; country?: string; page?: string }>
}) {
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page ?? 1))

  const [{ items, total }, submissionCounts, filterOptions] = await Promise.all([
    getAuthors({
      page,
      search: sp.search ?? null,
      campaignId: sp.campaign ?? null,
      country: sp.country ?? null,
    }),
    getSubmissionCounts(),
    getAuthorFilterOptions(),
  ])

  return (
    <>
      <PageHeader
        title="Authors"
        description="Manage contributors, review their submissions, and ban or reinstate accounts."
      />
      <AuthorsTable
        initialAuthors={items}
        total={total}
        currentPage={page}
        submissionCounts={submissionCounts}
        filterOptions={filterOptions}
        initialSearch={sp.search ?? ""}
        initialCampaign={sp.campaign ?? ""}
        initialCountry={sp.country ?? ""}
      />
    </>
  )
}
