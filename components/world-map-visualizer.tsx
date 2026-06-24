'use client'

import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import {
  geoNaturalEarth1,
  geoPath,
  geoGraticule,
  type GeoProjection,
} from 'd3-geo'
import { scaleSequential } from 'd3-scale'
import { interpolateRgb } from 'd3-interpolate'
import { color as d3colorParse } from 'd3-color'
import {
  select,
  type Selection,
} from 'd3-selection'
import {
  zoom as d3zoom,
  zoomIdentity,
  type ZoomBehavior,
} from 'd3-zoom'
import { feature } from 'topojson-client'
import { cn } from '@/lib/utils'
import {
  Globe,
  Search,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Users,
  MapPin,
  X,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CountryDataPoint {
  country: string
  count: number
  percentage: number
}

export interface CampaignMeta {
  id: string
  title: string
}

interface WorldMapVisualizerProps {
  allData: CountryDataPoint[]
  campaignData: Record<string, CountryDataPoint[]>
  campaigns: CampaignMeta[]
}

// Minimal TopoJSON topology shape
interface TopoCountries {
  type: 'Topology'
  objects: {
    countries: {
      type: string
      geometries: Array<{ type: string; id: string | number; arcs: unknown }>
    }
  }
  arcs: unknown
  transform?: unknown
}

// ---------------------------------------------------------------------------
// Rich mock fallback (used when DB returns nothing)
// ---------------------------------------------------------------------------

const MOCK_DATA: CountryDataPoint[] = [
  { country: 'United States', count: 214, percentage: 18.2 },
  { country: 'India', count: 187, percentage: 15.9 },
  { country: 'United Kingdom', count: 134, percentage: 11.4 },
  { country: 'Canada', count: 98, percentage: 8.3 },
  { country: 'Australia', count: 76, percentage: 6.5 },
  { country: 'Germany', count: 64, percentage: 5.4 },
  { country: 'Brazil', count: 55, percentage: 4.7 },
  { country: 'France', count: 48, percentage: 4.1 },
  { country: 'Nigeria', count: 43, percentage: 3.7 },
  { country: 'Pakistan', count: 38, percentage: 3.2 },
  { country: 'Kenya', count: 31, percentage: 2.6 },
  { country: 'Philippines', count: 27, percentage: 2.3 },
  { country: 'South Africa', count: 24, percentage: 2.0 },
  { country: 'Mexico', count: 21, percentage: 1.8 },
  { country: 'Indonesia', count: 18, percentage: 1.5 },
  { country: 'Japan', count: 15, percentage: 1.3 },
  { country: 'Norway', count: 12, percentage: 1.0 },
  { country: 'Sweden', count: 11, percentage: 0.9 },
  { country: 'New Zealand', count: 9, percentage: 0.8 },
  { country: 'Ghana', count: 7, percentage: 0.6 },
  { country: 'Bangladesh', count: 6, percentage: 0.5 },
  { country: 'Ethiopia', count: 5, percentage: 0.4 },
  { country: 'China', count: 4, percentage: 0.3 },
  { country: 'Argentina', count: 3, percentage: 0.3 },
]

// ---------------------------------------------------------------------------
// Country name → ISO numeric id mapping
// ---------------------------------------------------------------------------

const COUNTRY_NAME_TO_ID: Record<string, number> = {
  'Afghanistan': 4, 'Albania': 8, 'Algeria': 12, 'Angola': 24, 'Argentina': 32,
  'Australia': 36, 'Austria': 40, 'Bangladesh': 50, 'Belgium': 56, 'Bolivia': 68,
  'Brazil': 76, 'Bulgaria': 100, 'Cameroon': 120, 'Canada': 124, 'Chile': 152,
  'China': 156, 'Colombia': 170, 'Congo': 178, 'Democratic Republic of the Congo': 180,
  'Croatia': 191, 'Cuba': 192, 'Czech Republic': 203, 'Denmark': 208, 'Ecuador': 218,
  'Egypt': 818, 'Ethiopia': 231, 'Finland': 246, 'France': 250, 'Germany': 276,
  'Ghana': 288, 'Greece': 300, 'Guatemala': 320, 'Honduras': 340, 'Hungary': 348,
  'India': 356, 'Indonesia': 360, 'Iran': 364, 'Iraq': 368, 'Ireland': 372,
  'Israel': 376, 'Italy': 380, 'Jamaica': 388, 'Japan': 392, 'Jordan': 400,
  'Kazakhstan': 398, 'Kenya': 404, 'Libya': 434, 'Malaysia': 458, 'Mexico': 484,
  'Morocco': 504, 'Mozambique': 508, 'Myanmar': 104, 'Nepal': 524, 'Netherlands': 528,
  'New Zealand': 554, 'Nicaragua': 558, 'Nigeria': 566, 'North Korea': 408,
  'Norway': 578, 'Pakistan': 586, 'Panama': 591, 'Paraguay': 600, 'Peru': 604,
  'Philippines': 608, 'Poland': 616, 'Portugal': 620, 'Romania': 642, 'Russia': 643,
  'Saudi Arabia': 682, 'Senegal': 686, 'Serbia': 688, 'Slovakia': 703,
  'Somalia': 706, 'South Africa': 710, 'South Korea': 410, 'South Sudan': 728,
  'Spain': 724, 'Sri Lanka': 144, 'Sudan': 729, 'Sweden': 752, 'Switzerland': 756,
  'Syria': 760, 'Taiwan': 158, 'Tanzania': 834, 'Thailand': 764, 'Tunisia': 788,
  'Turkey': 792, 'Uganda': 800, 'Ukraine': 804, 'United Arab Emirates': 784,
  'United Kingdom': 826, 'United States': 840, 'Uruguay': 858, 'Uzbekistan': 860,
  'Venezuela': 862, 'Vietnam': 704, 'Yemen': 887, 'Zambia': 894, 'Zimbabwe': 716,
}

// Reverse map: id → name
const ID_TO_NAME: Map<number, string> = new Map(
  Object.entries(COUNTRY_NAME_TO_ID).map(([name, id]) => [id, name]),
)

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

function buildColorScale(data: CountryDataPoint[]) {
  const maxCount = Math.max(...data.map((d) => d.count), 1)
  return scaleSequential(interpolateRgb('#162620', '#84cc16')).domain([0, maxCount])
}

function getCountryFill(
  countryName: string,
  countryMap: Map<string, CountryDataPoint>,
  colorScale: ReturnType<typeof buildColorScale>,
  isDark: boolean,
): string {
  const d = countryMap.get(countryName.toLowerCase())
  if (!d) return isDark ? '#1e2e26' : '#d4e8dc'
  return colorScale(d.count)
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function CountrySidebar({
  data,
  selectedCountry,
  onSelectCountry,
}: {
  data: CountryDataPoint[]
  selectedCountry: string | null
  onSelectCountry: (name: string | null) => void
}) {
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter((d) => d.country.toLowerCase().includes(q))
  }, [data, search])

  const displayed = showAll ? filtered : filtered.slice(0, 10)
  const total = data.reduce((s, d) => s + d.count, 0)

  return (
    <aside
      className="flex flex-col gap-3 rounded-xl border border-border bg-card"
      aria-label="Country rankings"
    >
      <div className="flex items-center justify-between border-b border-border px-4 pt-4 pb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="size-4 text-primary" aria-hidden />
          <span className="text-sm font-semibold text-foreground">Country Rankings</span>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {data.length} countries
        </span>
      </div>

      <div className="relative px-4">
        <Search
          className="pointer-events-none absolute left-7 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search countries…"
          aria-label="Search countries"
          className="w-full rounded-lg border border-border bg-background py-1.5 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 px-4">
        <div className="rounded-lg bg-muted/60 px-3 py-2 text-center">
          <div className="text-base font-bold text-foreground tabular-nums">{total.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground">total participants</div>
        </div>
        <div className="rounded-lg bg-muted/60 px-3 py-2 text-center">
          <div className="text-base font-bold text-foreground tabular-nums">{data.length}</div>
          <div className="text-[10px] text-muted-foreground">countries</div>
        </div>
      </div>

      <ol
        className="flex flex-col gap-0.5 overflow-y-auto px-2"
        style={{ maxHeight: '420px' }}
        aria-label="Countries ranked by participants"
      >
        {displayed.length === 0 ? (
          <li className="px-2 py-6 text-center text-sm text-muted-foreground">No results</li>
        ) : (
          displayed.map((item) => {
            const rank = data.indexOf(item) + 1
            const isSelected = selectedCountry?.toLowerCase() === item.country.toLowerCase()
            const barPct = total > 0 ? (item.count / data[0].count) * 100 : 0

            return (
              <li key={item.country}>
                <button
                  onClick={() => onSelectCountry(isSelected ? null : item.country)}
                  className={cn(
                    'group relative w-full rounded-lg px-3 py-2 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isSelected
                      ? 'bg-primary/15 ring-1 ring-primary/40'
                      : 'hover:bg-muted/70',
                  )}
                  aria-pressed={isSelected}
                  aria-label={`${item.country}: ${item.count} participants, rank ${rank}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums',
                        rank === 1 ? 'bg-amber-400/20 text-amber-500 dark:text-amber-400' :
                        rank === 2 ? 'bg-slate-300/20 text-slate-500 dark:text-slate-400' :
                        rank === 3 ? 'bg-orange-400/20 text-orange-500 dark:text-orange-400' :
                        'bg-muted text-muted-foreground',
                      )}
                    >
                      {rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className={cn(
                          'truncate text-xs font-medium leading-none',
                          isSelected ? 'text-primary' : 'text-foreground',
                        )}>
                          {item.country}
                        </span>
                        <span className="shrink-0 tabular-nums text-[10px] text-muted-foreground">
                          {item.count.toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-500"
                          style={{ width: `${barPct}%` }}
                          role="presentation"
                        />
                      </div>
                    </div>
                  </div>
                </button>
              </li>
            )
          })
        )}
      </ol>

      {filtered.length > 10 && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          <button
            onClick={() => setShowAll((v) => !v)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            {showAll ? (
              <>Show less <ChevronUp className="size-3.5" aria-hidden /></>
            ) : (
              <>Show all {filtered.length} <ChevronDown className="size-3.5" aria-hidden /></>
            )}
          </button>
        </div>
      )}
    </aside>
  )
}

// ---------------------------------------------------------------------------
// Selected Country Detail Panel
// ---------------------------------------------------------------------------

function CountryDetail({
  country,
  data,
  rank,
  totalParticipants,
  onClose,
}: {
  country: string
  data: CountryDataPoint
  rank: number
  totalParticipants: number
  onClose: () => void
}) {
  const barPct = totalParticipants > 0 ? (data.count / totalParticipants) * 100 : 0

  return (
    <div
      className="absolute left-3 bottom-14 z-30 max-w-[220px] rounded-xl border border-primary/30 bg-card/95 p-3.5 shadow-xl backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={`${country} detail panel`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0 text-primary" aria-hidden />
          <span className="text-sm font-semibold leading-tight text-foreground text-balance">
            {country}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          aria-label="Close detail panel"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-muted/60 px-2 py-1.5 text-center">
          <div className="text-sm font-bold tabular-nums text-foreground">
            {data.count.toLocaleString()}
          </div>
          <div className="text-[10px] text-muted-foreground">participants</div>
        </div>
        <div className="rounded-lg bg-muted/60 px-2 py-1.5 text-center">
          <div className="text-sm font-bold tabular-nums text-foreground">#{rank}</div>
          <div className="text-[10px] text-muted-foreground">rank</div>
        </div>
      </div>
      <div>
        <div className="mb-1 flex justify-between text-[10px] text-muted-foreground">
          <span>Share of total</span>
          <span className="font-medium text-foreground">{data.percentage.toFixed(1)}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${barPct}%` }}
            role="presentation"
          />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tooltip state
// ---------------------------------------------------------------------------

interface TooltipState {
  visible: boolean
  x: number
  y: number
  country: string
  data: CountryDataPoint | null
  rank: number
}

// ---------------------------------------------------------------------------
// Feature shape (what topojson-client `feature` returns)
// ---------------------------------------------------------------------------

interface GeoFeature {
  type: 'Feature'
  id?: string | number
  geometry: { type: string; coordinates: unknown } | null
  properties: Record<string, unknown> | null
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function WorldMapVisualizer({
  allData,
  campaignData,
  campaigns,
}: WorldMapVisualizerProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  const resolvedAllData = allData.length > 0 ? allData : MOCK_DATA

  const [activeCampaignId, setActiveCampaignId] = useState<string>('all')
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, country: '', data: null, rank: 0,
  })
  const [dimensions, setDimensions] = useState({ width: 800, height: 416 })
  const [isLoading, setIsLoading] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const [topoData, setTopoData] = useState<TopoCountries | null>(null)

  const activeData: CountryDataPoint[] = useMemo(() => {
    if (activeCampaignId === 'all') return resolvedAllData
    const cd = campaignData[activeCampaignId]
    return cd && cd.length > 0 ? cd : []
  }, [activeCampaignId, resolvedAllData, campaignData])

  const countryMap = useMemo(
    () => new Map(activeData.map((d) => [d.country.toLowerCase(), d])),
    [activeData],
  )

  const colorScale = useMemo(() => buildColorScale(activeData), [activeData])

  const rankMap = useMemo(
    () => new Map(activeData.map((d, i) => [d.country.toLowerCase(), i + 1])),
    [activeData],
  )

  const totalParticipants = useMemo(
    () => activeData.reduce((s, d) => s + d.count, 0),
    [activeData],
  )

  // Detect dark mode
  useEffect(() => {
    const check = () =>
      setIsDark(document.documentElement.classList.contains('dark'))
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      const w = entry.contentRect.width
      setDimensions({ width: w, height: Math.round(w * 0.52) })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Fetch TopoJSON once
  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then((r) => r.json())
      .then((topo: TopoCountries) => {
        setTopoData(topo)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  // Build D3 map
  useEffect(() => {
    if (!topoData || !svgRef.current || dimensions.width === 0) return

    const { width, height } = dimensions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svg: Selection<SVGSVGElement, unknown, null, undefined> = select(svgRef.current as any)
    svg.selectAll('*').remove()

    // Defs — glow filter
    const defs = svg.append('defs')
    defs.append('filter')
      .attr('id', 'country-glow')
      .attr('x', '-20%').attr('y', '-20%')
      .attr('width', '140%').attr('height', '140%')
      .append('feDropShadow')
      .attr('dx', 0).attr('dy', 0)
      .attr('stdDeviation', 3)
      .attr('flood-color', '#84cc16')
      .attr('flood-opacity', 0.6)

    const projection: GeoProjection = geoNaturalEarth1()
      .fitSize([width, height], { type: 'Sphere' })

    const path = geoPath().projection(projection)

    const g = svg.append('g').attr('class', 'map-root')

    // Ocean
    g.append('path')
      .datum({ type: 'Sphere' })
      .attr('d', (d) => path(d as Parameters<typeof path>[0]) ?? '')
      .attr('fill', isDark ? '#0d1a14' : '#cde9d5')
      .attr('stroke', 'none')

    // Graticule
    const graticule = geoGraticule()
    g.append('path')
      .datum(graticule())
      .attr('d', (d) => path(d as Parameters<typeof path>[0]) ?? '')
      .attr('fill', 'none')
      .attr('stroke', isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)')
      .attr('stroke-width', 0.5)

    // Countries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const countries = (feature(topoData as any, (topoData as any).objects.countries) as unknown) as {
      type: 'FeatureCollection'
      features: GeoFeature[]
    }

    const getFill = (d: GeoFeature): string => {
      const name = ID_TO_NAME.get(Number(d.id))
      if (!name) return isDark ? '#1a2820' : '#cde9d5'
      return getCountryFill(name, countryMap, colorScale, isDark)
    }

    const getStroke = (d: GeoFeature): string => {
      const name = ID_TO_NAME.get(Number(d.id))
      const isSel = name && selectedCountry?.toLowerCase() === name.toLowerCase()
      if (isSel) return '#84cc16'
      return isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)'
    }

    const getStrokeWidth = (d: GeoFeature): number => {
      const name = ID_TO_NAME.get(Number(d.id))
      return name && selectedCountry?.toLowerCase() === name.toLowerCase() ? 1.5 : 0.4
    }

    g.selectAll<SVGPathElement, GeoFeature>('path.country')
      .data(countries.features)
      .join('path')
      .attr('class', 'country')
      .attr('d', (d) => path(d as Parameters<typeof path>[0]) ?? '')
      .attr('fill', getFill)
      .attr('stroke', getStroke)
      .attr('stroke-width', getStrokeWidth)
      .attr('stroke-linejoin', 'round')
      .attr('filter', (d) => {
        const name = ID_TO_NAME.get(Number(d.id))
        return name && selectedCountry?.toLowerCase() === name.toLowerCase()
          ? 'url(#country-glow)'
          : 'none'
      })
      .style('cursor', (d) => {
        const name = ID_TO_NAME.get(Number(d.id))
        return name && countryMap.has(name.toLowerCase()) ? 'pointer' : 'default'
      })
      .on('mouseenter', function (event: MouseEvent, d: GeoFeature) {
        const name = ID_TO_NAME.get(Number(d.id))
        if (!name) return
        const data = countryMap.get(name.toLowerCase())
        if (!data) return

        // Brighten fill on hover
        const base = colorScale(data.count)
        const c = d3colorParse(base)
        const brightened = c ? c.brighter(0.4).toString() : base

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        select(this as any)
          .raise()
          .attr('fill', brightened)
          .attr('stroke', '#84cc16')
          .attr('stroke-width', 1.5)

        const rect = svgRef.current!.getBoundingClientRect()
        const rank = rankMap.get(name.toLowerCase()) ?? 0
        setTooltip({
          visible: true,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          country: name,
          data,
          rank,
        })
      })
      .on('mousemove', function (event: MouseEvent) {
        const rect = svgRef.current!.getBoundingClientRect()
        setTooltip((prev) => ({
          ...prev,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        }))
      })
      .on('mouseleave', function (_: MouseEvent, d: GeoFeature) {
        const name = ID_TO_NAME.get(Number(d.id))
        if (!name) return
        const isSel = selectedCountry?.toLowerCase() === name.toLowerCase()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        select(this as any)
          .attr('fill', getFill(d))
          .attr('stroke', isSel ? '#84cc16' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)'))
          .attr('stroke-width', isSel ? 1.5 : 0.4)
          .attr('filter', isSel ? 'url(#country-glow)' : 'none')
        setTooltip((prev) => ({ ...prev, visible: false }))
      })
      .on('click', function (_: MouseEvent, d: GeoFeature) {
        const name = ID_TO_NAME.get(Number(d.id))
        if (!name || !countryMap.has(name.toLowerCase())) return
        setSelectedCountry((prev) =>
          prev?.toLowerCase() === name.toLowerCase() ? null : name,
        )
      })

    // Globe outline
    g.append('path')
      .datum({ type: 'Sphere' })
      .attr('d', (d) => path(d as Parameters<typeof path>[0]) ?? '')
      .attr('fill', 'none')
      .attr('stroke', isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)')
      .attr('stroke-width', 0.8)

    // Zoom
    const zoom = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString())
      })
    zoomRef.current = zoom
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    svg.call(zoom as any)

    return () => {
      svg.on('.zoom', null)
    }
  }, [topoData, dimensions, isDark, countryMap, colorScale, rankMap, selectedCountry])

  // Re-color on data/selection change (without full rebuild)
  // Handled by the main effect since selectedCountry is a dependency

  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select(svgRef.current as any)
      .transition().duration(300)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .call((zoomRef.current as any).scaleBy, 1.5)
  }, [])

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select(svgRef.current as any)
      .transition().duration(300)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .call((zoomRef.current as any).scaleBy, 1 / 1.5)
  }, [])

  const handleReset = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    select(svgRef.current as any)
      .transition().duration(400)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .call((zoomRef.current as any).transform, zoomIdentity)
  }, [])

  const selectedData = selectedCountry
    ? countryMap.get(selectedCountry.toLowerCase())
    : undefined
  const selectedRank = selectedCountry
    ? (rankMap.get(selectedCountry.toLowerCase()) ?? 0)
    : 0

  const legendStops = useMemo(() => {
    if (activeData.length === 0) return []
    const maxCount = Math.max(...activeData.map((d) => d.count), 1)
    return [0, 0.25, 0.5, 0.75, 1].map((t) => ({
      t,
      color: colorScale(t * maxCount),
    }))
  }, [activeData, colorScale])

  const maxCount = activeData.length > 0 ? Math.max(...activeData.map((d) => d.count)) : 0

  const activeCampaignTitle =
    activeCampaignId === 'all'
      ? 'All Campaigns'
      : campaigns.find((c) => c.id === activeCampaignId)?.title ?? 'Campaign'

  return (
    <div className="flex flex-col gap-4">
      {/* Summary stats strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <Globe className="size-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <div className="text-lg font-bold tabular-nums text-foreground leading-none">
              {activeData.length}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">countries</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <Users className="size-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <div className="text-lg font-bold tabular-nums text-foreground leading-none">
              {totalParticipants.toLocaleString()}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">participants</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <TrendingUp className="size-4 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground leading-none">
              {activeData[0]?.country ?? '—'}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">top country</div>
          </div>
        </div>
      </div>

      {/* Campaign tabs */}
      {campaigns.length > 0 && (
        <div
          className="flex items-center gap-1.5 overflow-x-auto rounded-xl border border-border bg-card p-1.5"
          role="tablist"
          aria-label="Filter by campaign"
        >
          <button
            role="tab"
            aria-selected={activeCampaignId === 'all'}
            onClick={() => setActiveCampaignId('all')}
            className={cn(
              'shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              activeCampaignId === 'all'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
            )}
          >
            All Campaigns
          </button>
          {campaigns.map((c) => (
            <button
              key={c.id}
              role="tab"
              aria-selected={activeCampaignId === c.id}
              onClick={() => setActiveCampaignId(c.id)}
              className={cn(
                'shrink-0 rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                activeCampaignId === c.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
              )}
            >
              {c.title}
            </button>
          ))}
        </div>
      )}

      {/* Main grid: map + sidebar */}
      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        {/* Map panel */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-card">
          {/* Map header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Globe className="size-4 text-primary" aria-hidden />
              <span className="text-sm font-semibold text-foreground">
                {activeCampaignTitle}
              </span>
              {allData.length === 0 && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                  Demo data
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleZoomIn}
                aria-label="Zoom in"
                className="rounded-lg border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <button
                onClick={handleZoomOut}
                aria-label="Zoom out"
                className="rounded-lg border border-border bg-background p-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                  <path d="M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <button
                onClick={handleReset}
                aria-label="Reset view"
                className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              >
                Reset
              </button>
            </div>
          </div>

          {/* SVG container */}
          <div ref={containerRef} className="relative w-full" style={{ minHeight: '320px' }}>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-card/80 z-20">
                <div className="flex flex-col items-center gap-3">
                  <div
                    className="size-7 animate-spin rounded-full border-2 border-border border-t-primary"
                    role="status"
                    aria-label="Loading map"
                  />
                  <span className="text-xs text-muted-foreground">Loading world map…</span>
                </div>
              </div>
            )}

            <svg
              ref={svgRef}
              width={dimensions.width}
              height={dimensions.height}
              viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
              className="block w-full"
              aria-label={`World map showing participant distribution for ${activeCampaignTitle}`}
              role="img"
              style={{ height: dimensions.height > 0 ? dimensions.height : 440 }}
            />

            {/* Tooltip */}
            {tooltip.visible && tooltip.data && (
              <div
                className="pointer-events-none absolute z-20 rounded-xl border border-border bg-popover px-3 py-2.5 shadow-xl"
                style={{
                  left: Math.min(tooltip.x + 12, dimensions.width - 185),
                  top: tooltip.y > dimensions.height * 0.65
                    ? tooltip.y - 92
                    : tooltip.y + 12,
                  maxWidth: 180,
                }}
                role="tooltip"
                aria-hidden="true"
              >
                <div className="mb-1.5 flex items-center gap-1.5">
                  <div
                    className="size-2.5 shrink-0 rounded-sm"
                    style={{ background: colorScale(tooltip.data.count) }}
                    aria-hidden
                  />
                  <span className="text-xs font-semibold text-popover-foreground leading-none">
                    {tooltip.country}
                  </span>
                </div>
                <div className="space-y-0.5 text-[11px] text-muted-foreground">
                  <div className="flex justify-between gap-4">
                    <span>Participants</span>
                    <span className="font-medium text-popover-foreground tabular-nums">
                      {tooltip.data.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Share</span>
                    <span className="font-medium text-popover-foreground">
                      {tooltip.data.percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span>Rank</span>
                    <span className="font-medium text-popover-foreground">#{tooltip.rank}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Click-selected detail */}
            {selectedCountry && selectedData && (
              <CountryDetail
                country={selectedCountry}
                data={selectedData}
                rank={selectedRank}
                totalParticipants={totalParticipants}
                onClose={() => setSelectedCountry(null)}
              />
            )}
          </div>

          {/* Legend + hint */}
          {legendStops.length > 0 && (
            <div className="border-t border-border px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground shrink-0">0</span>
                <div
                  className="h-2 flex-1 rounded-full"
                  style={{
                    background: `linear-gradient(to right, ${legendStops.map((s) => s.color).join(', ')})`,
                  }}
                  aria-hidden
                />
                <span className="text-[10px] font-medium text-foreground tabular-nums shrink-0">
                  {maxCount.toLocaleString()}
                </span>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Scroll to zoom · drag to pan · click a country to inspect
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <CountrySidebar
          data={activeData}
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
        />
      </div>
    </div>
  )
}
