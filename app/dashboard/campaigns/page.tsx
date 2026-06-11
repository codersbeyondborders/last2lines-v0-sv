import Link from "next/link"
import { Plus } from "lucide-react"
import { PageHeader } from "@/components/admin/page-header"
import { CampaignsTable } from "@/components/admin/campaigns-table"
import { Button } from "@/components/ui/button"

export default function CampaignsPage() {
  return (
    <>
      <PageHeader
        title="Campaigns"
        description="Create and manage poetry campaigns, their status, and AI moderation level."
        action={
          <Button
            nativeButton={false}
            render={
              <Link href="/dashboard/campaigns/new">
                <Plus className="size-4" aria-hidden="true" />
                New campaign
              </Link>
            }
          />
        }
      />
      <CampaignsTable />
    </>
  )
}
