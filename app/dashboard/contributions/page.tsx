import { PageHeader } from "@/components/admin/page-header"
import { ContributionsTable } from "@/components/admin/contributions-table"
import { getAllContributions, getCampaigns } from "@/lib/queries"

export default async function ContributionsPage({
  searchParams,
}: {
  searchParams: Promise<{ author?: string }>
}) {
  const { author } = await searchParams
  const [contributions, campaigns] = await Promise.all([
    getAllContributions(),
    getCampaigns(),
  ])
  const campaignTitles = Object.fromEntries(
    campaigns.map((c) => [c.id, c.title]),
  )

  return (
    <>
      <PageHeader
        title="Contributions"
        description="Review every submitted couplet, override AI decisions, edit lines, or remove entries."
      />
      <ContributionsTable
        initialContributions={contributions}
        campaignTitles={campaignTitles}
        authorId={author}
      />
    </>
  )
}
