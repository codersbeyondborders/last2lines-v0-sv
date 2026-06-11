import { PageHeader } from "@/components/admin/page-header"
import { AuthorsTable } from "@/components/admin/authors-table"

export default function AuthorsPage() {
  return (
    <>
      <PageHeader
        title="Authors"
        description="Manage contributors, review their submissions, and ban or reinstate accounts."
      />
      <AuthorsTable />
    </>
  )
}
