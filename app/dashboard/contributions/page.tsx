import { PageHeader } from "@/components/admin/page-header"
import { ContributionsTable } from "@/components/admin/contributions-table"

export default async function ContributionsPage({
  searchParams,
}: {
  searchParams: Promise<{ author?: string }>
}) {
  const { author } = await searchParams

  return (
    <>
      <PageHeader
        title="Contributions"
        description="Review every submitted couplet, override AI decisions, edit lines, or remove entries."
      />
      <ContributionsTable authorId={author} />
    </>
  )
}
