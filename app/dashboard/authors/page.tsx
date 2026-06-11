import { PageHeader } from "@/components/admin/page-header"
import { AuthorsTable } from "@/components/admin/authors-table"
import { getAuthors, getSubmissionCounts } from "@/lib/queries"

export default async function AuthorsPage() {
  const [authors, submissionCounts] = await Promise.all([
    getAuthors(),
    getSubmissionCounts(),
  ])

  return (
    <>
      <PageHeader
        title="Authors"
        description="Manage contributors, review their submissions, and ban or reinstate accounts."
      />
      <AuthorsTable
        initialAuthors={authors}
        submissionCounts={submissionCounts}
      />
    </>
  )
}
