import { Suspense } from "react"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { WorldMapVisualizer } from "@/components/world-map-visualizer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getContributionsByCountry } from "@/lib/queries"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Global Contributions Map — Last2Lines",
  description:
    "Visualize campaign contributions from around the world. See where voices are coming from in the collective poetry movement.",
}

async function MapContent() {
  const data = await getContributionsByCountry()
  
  if (!data || data.length === 0) {
    return (
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle>No Contributions Yet</CardTitle>
          <CardDescription>
            When contributors submit approved couplets, they&apos;ll appear on this map.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Start a campaign and invite contributors to see the world light up with voices.
          </p>
        </CardContent>
      </Card>
    )
  }

  return <WorldMapVisualizer data={data} campaignName="Global Contributions" />
}

function MapSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-lg border border-border bg-muted/30 h-96 animate-pulse" />
      <div className="rounded-lg border border-border bg-muted/30 h-96 animate-pulse" />
    </div>
  )
}

export default function VisualizePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      
      <main className="flex-1 mx-auto w-full max-w-7xl px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors">
              <ArrowLeft className="size-4" />
              Back to home
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-balance">
              Global Contributions
            </h1>
            <p className="mt-2 text-lg text-muted-foreground max-w-xl text-pretty">
              Explore where voices from around the world are joining the collective poetry movement.
            </p>
          </div>
        </div>

        {/* Map Visualization */}
        <Suspense fallback={<MapSkeleton />}>
          <MapContent />
        </Suspense>

        {/* Info Section */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Interactive Map</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Hover over or click on any country bubble to see the number of approved contributions from that region. The size of each bubble represents the volume of contributions.
              </p>
              <p className="text-xs">Use your mouse to pan and scroll to zoom in on specific regions.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">What You&apos;re Seeing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Each colored bubble represents a country. The data includes all approved contributions across campaigns, aggregated by the contributor&apos;s country of residence.
              </p>
              <p className="text-xs">Colors and sizes are normalized to show relative distribution patterns.</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
