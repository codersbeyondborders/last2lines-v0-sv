"use client"

import { useMemo, useState, useEffect } from "react"
import dynamic from "next/dynamic"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts"
import { Info, TrendingUp } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { LatLngTuple } from "leaflet"

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() =>
  import("react-leaflet").then((m) => ({ default: m.MapContainer })),
  { ssr: false },
)
const TileLayer = dynamic(() =>
  import("react-leaflet").then((m) => ({ default: m.TileLayer })),
  { ssr: false },
)
const CircleMarker = dynamic(() =>
  import("react-leaflet").then((m) => ({ default: m.CircleMarker })),
  { ssr: false },
)
const Popup = dynamic(() =>
  import("react-leaflet").then((m) => ({ default: m.Popup })),
  { ssr: false },
)

// Mapping of countries to approximate coordinates (center point)
const COUNTRY_COORDINATES: Record<string, LatLngTuple> = {
  "United States": [37.0902, -95.7129],
  Canada: [56.1304, -106.3468],
  "United Kingdom": [55.3781, -3.436],
  Germany: [51.1657, 10.4515],
  France: [46.2276, 2.2137],
  India: [20.5937, 78.9629],
  Brazil: [-14.2350, -51.9253],
  Australia: [-25.2744, 133.7751],
  Japan: [36.2048, 138.2529],
  China: [35.8617, 104.1954],
  Mexico: [23.6345, -102.5528],
  Spain: [40.4637, -3.7492],
  Italy: [41.8719, 12.5674],
  Netherlands: [52.1326, 5.2913],
  Sweden: [60.1282, 18.6435],
  Switzerland: [46.8182, 8.2275],
  Poland: [51.9194, 19.1451],
  Russia: [61.524, 105.3188],
  "South Korea": [35.9078, 127.7669],
  Singapore: [1.3521, 103.8198],
  Thailand: [15.87, 100.9925],
  Vietnam: [14.0583, 108.2772],
  Indonesia: [-0.7893, 113.9213],
  Philippines: [12.8797, 121.774],
  Malaysia: [4.2105, 101.6964],
  Pakistan: [30.3753, 69.3451],
  "New Zealand": [-40.9006, 174.886],
  Greece: [39.0742, 21.8243],
  Portugal: [39.3999, -8.2245],
  Ireland: [53.4129, -8.2439],
  Denmark: [56.26, 9.5018],
  Norway: [60.472, 8.4689],
  Finland: [61.9241, 25.7482],
  Belgium: [50.5039, 4.4699],
  Austria: [47.5162, 14.5501],
  "Czech Republic": [49.8175, 15.4730],
  Hungary: [47.1625, 19.5033],
  Romania: [45.9432, 24.9668],
  Turkey: [38.9637, 35.2433],
  Egypt: [26.8206, 30.8025],
  "South Africa": [-30.5595, 22.9375],
  "Saudi Arabia": [23.8859, 45.0792],
  "United Arab Emirates": [23.4241, 53.8478],
  Argentina: [-38.4161, -63.6167],
  Chile: [-35.6751, -71.5430],
  Colombia: [4.5709, -74.2973],
  Peru: [-9.19, -75.0152],
  Nigeria: [9.0820, 8.6753],
  Kenya: [-0.0236, 37.9062],
  Ukraine: [48.3794, 31.1656],
  Israel: [31.0461, 34.8516],
  Lebanon: [33.8547, 35.8623],
  Bangladesh: [23.685, 90.3563],
  "Sri Lanka": [7.8731, 80.7718],
  Myanmar: [21.9162, 95.9560],
  Cambodia: [12.5657, 104.9910],
  Laos: [19.8523, 102.4955],
  Taiwan: [23.6978, 120.9605],
  Kazakhstan: [48.0196, 66.9237],
  Uzbekistan: [41.3775, 64.5853],
  Georgia: [42.3154, 43.3569],
  Armenia: [40.0691, 45.0382],
  Azerbaijan: [40.1431, 47.5769],
  Belarus: [53.7098, 27.9534],
  Moldova: [47.4116, 28.3699],
  Serbia: [44.0165, 21.0059],
  Croatia: [45.1, 15.2],
  "Bosnia and Herzegovina": [43.9159, 17.6791],
  Slovenia: [46.1512, 14.9955],
  Slovakia: [48.6690, 19.6990],
  Lithuania: [55.1694, 23.8812],
  Latvia: [56.8796, 24.6032],
  Estonia: [58.5953, 25.0136],
  Iceland: [64.9631, -19.0208],
  Luxembourg: [49.8153, 6.1296],
  Malta: [35.9375, 14.3754],
  Cyprus: [34.9249, 33.4299],
  "Hong Kong": [22.3193, 114.1694],
  Macau: [22.1987, 113.5439],
  "Puerto Rico": [18.2208, -66.5901],
  Bahamas: [25.0343, -77.3963],
  Jamaica: [18.1096, -77.2975],
  "Trinidad and Tobago": [10.6918, -61.2225],
  Mauritius: [-20.3484, 57.5522],
  Reunion: [-21.1151, 55.5364],
  Iceland: [64.9631, -19.0208],
  Greenland: [71.7069, -42.6043],
  "Faroe Islands": [61.892, -6.9118],
  Andorra: [42.5406, 1.5755],
  Monaco: [43.7384, 7.4246],
  Liechtenstein: [47.1660, 9.5554],
  Montenegro: [42.7087, 19.3744],
  Macedonia: [41.6086, 21.7453],
  Albania: [41.1533, 20.1683],
  Bulgaria: [42.7339, 25.4858],
  Default: [20, 0],
}

interface ContributionData {
  country: string
  count: number
  percentage: number
}

interface WorldMapVisualizerProps {
  data: ContributionData[]
  campaignName?: string
}

export function WorldMapVisualizer({ data, campaignName }: WorldMapVisualizerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prepare data for the sidebar stats
  const topCountries = useMemo(() => data.slice(0, 10), [data])
  const totalContributions = useMemo(
    () => data.reduce((sum, item) => sum + item.count, 0),
    [data],
  )
  const countryCount = data.length

  // Prepare map markers with normalized sizes and colors
  const markers = useMemo(() => {
    if (!data.length) return []

    const maxCount = Math.max(...data.map((d) => d.count))

    return data
      .map((item) => {
        const coords = COUNTRY_COORDINATES[item.country] || COUNTRY_COORDINATES.Default
        const size = Math.max(8, Math.min(40, (item.count / maxCount) * 40))
        const hue = ((item.count / totalContributions) * 360) % 360

        return {
          country: item.country,
          count: item.count,
          percentage: item.percentage,
          coords,
          size,
          hue,
          color: `hsl(${hue}, 70%, 50%)`,
        }
      })
      .filter((m) => m.coords)
  }, [data, totalContributions])

  if (!mounted) {
    return (
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-lg border border-border bg-muted/30 h-96 flex items-center justify-center">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-muted-foreground">Loading statistics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Map */}
        <div className="lg:col-span-2 rounded-lg border border-border overflow-hidden bg-background">
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: "600px", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              maxZoom={19}
            />
            {markers.map((marker) => (
              <CircleMarker
                key={marker.country}
                center={marker.coords}
                radius={marker.size}
                fillColor={marker.color}
                color={marker.color}
                weight={2}
                opacity={0.8}
                fillOpacity={0.7}
              >
                <Popup>
                  <div className="text-sm font-medium">
                    <p className="font-semibold text-foreground">{marker.country}</p>
                    <p className="text-muted-foreground">
                      {marker.count} contribution{marker.count !== 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {marker.percentage.toFixed(1)}% of total
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
          </MapContainer>
        </div>

        {/* Stats Sidebar */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Global Reach</CardTitle>
              {campaignName && <CardDescription>{campaignName}</CardDescription>}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-foreground">{countryCount}</div>
                <div className="text-sm text-muted-foreground">countries</div>
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold text-foreground">{totalContributions}</div>
                <div className="text-sm text-muted-foreground">contributions</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="size-4" />
                Top Contributors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topCountries.map((item, index) => (
                  <div key={item.country} className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{index + 1}. {item.country}</p>
                      <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                          style={{ width: `${(item.count / topCountries[0].count) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-foreground">{item.count}</p>
                      <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="size-4" />
            Distribution by Country
          </CardTitle>
          <CardDescription>Top 15 countries by contribution count</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="country" 
                angle={-45} 
                textAnchor="end" 
                height={120} 
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                formatter={(value: number) => [value, "Contributions"]}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]}>
                {data.slice(0, 15).map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`hsl(${(index / 15) * 360}, 70%, 50%)`}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
