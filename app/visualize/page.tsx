import Link from "next/link"
import { ArrowLeft, MousePointerClick, ZoomIn, Layers, Globe } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { WorldMapVisualizer } from "@/components/world-map-visualizer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getCampaigns,
  getContributionsByCountryAllCampaigns,
} from "@/lib/queries"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Global Contributions Map — Last2Lines",
  description:
    "Visualize campaign contributions from around the world. See where voices are coming from in the collective poetry movement.",
}

export default async function VisualizePage() {
  let campaigns: Awaited<ReturnType<typeof getCampaigns>> = []
  let allData: import("@/lib/queries").CountryDataPoint[] = []
  let perCampaignData: Record<string, import("@/lib/queries").CountryDataPoint[]> = {}

  try {
    campaigns = await getCampaigns()
  } catch {
    // DB unavailable — fall through with empty arrays; component uses mock data
  }

  try {
    const campaignIds = campaigns.map((c) => c.id)
    const countryDataByCampaign = await getContributionsByCountryAllCampaigns(campaignIds)
    allData = countryDataByCampaign.all ?? []
    const { all: _all, ...rest } = countryDataByCampaign
    perCampaignData = rest
  } catch {
    // DB unavailable — component renders with built-in mock data
  }

  const campaignMeta = campaigns.map((c) => ({ id: c.id, title: c.title }))

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Page header */}
        <header className="mb-8 space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to home
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-balance sm:text-4xl">
              Global Contributions
            </h1>
            <p className="mt-2 max-w-xl text-base text-muted-foreground text-pretty leading-relaxed">
              Explore where voices from around the world are joining the collective poetry movement. Switch campaigns, click countries, and scan the sidebar for a ranked breakdown.
            </p>
          </div>
        </header>

        {/* Map Visualization — self-contained with tabs + sidebar */}
        <section aria-label="World map visualization">
          <WorldMapVisualizer
            allData={allData}
            campaignData={perCampaignData}
            campaigns={campaignMeta}
          />
        </section>

        {/* How to use cards */}
        <section className="mt-12" aria-labelledby="how-to-use-heading">
          <h2 id="how-to-use-heading" className="sr-only">How to use the map</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="size-4 text-primary shrink-0" aria-hidden />
                  <CardTitle className="text-sm font-semibold">Hover &amp; Click</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                Hover a country to see its stats in the floating tooltip. Click to pin a detail card with share and rank.
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <ZoomIn className="size-4 text-primary shrink-0" aria-hidden />
                  <CardTitle className="text-sm font-semibold">Zoom &amp; Pan</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                Scroll to zoom into any region. Click and drag to pan. Use the controls in the map header to reset.
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Layers className="size-4 text-primary shrink-0" aria-hidden />
                  <CardTitle className="text-sm font-semibold">Campaign Filter</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                Switch between the aggregate view or drill into a single campaign using the tabs above the map.
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <Globe className="size-4 text-primary shrink-0" aria-hidden />
                  <CardTitle className="text-sm font-semibold">Data Source</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground leading-relaxed">
                Only approved couplets are counted, aggregated by contributors&apos; self-reported country.
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
