"use client"

import { useMemo, useRef, useEffect, useState } from "react"
import { useTheme } from "next-themes"

// ISO alpha-2 → display name mapping (subset)
const CODE_TO_NAME: Record<string, string> = {
  US: "United States", CA: "Canada", GB: "United Kingdom", DE: "Germany",
  FR: "France", IN: "India", BR: "Brazil", AU: "Australia", JP: "Japan",
  CN: "China", MX: "Mexico", ES: "Spain", IT: "Italy", NL: "Netherlands",
  SE: "Sweden", CH: "Switzerland", PL: "Poland", RU: "Russia", KR: "South Korea",
  SG: "Singapore", TH: "Thailand", VN: "Vietnam", ID: "Indonesia", PH: "Philippines",
  MY: "Malaysia", PK: "Pakistan", NZ: "New Zealand", GR: "Greece", PT: "Portugal",
  IE: "Ireland", DK: "Denmark", NO: "Norway", FI: "Finland", BE: "Belgium",
  AT: "Austria", CZ: "Czech Republic", HU: "Hungary", RO: "Romania", TR: "Turkey",
  EG: "Egypt", ZA: "South Africa", SA: "Saudi Arabia", AE: "United Arab Emirates",
  AR: "Argentina", CL: "Chile", CO: "Colombia", PE: "Peru", NG: "Nigeria",
  KE: "Kenya", UA: "Ukraine", IL: "Israel", BD: "Bangladesh", LK: "Sri Lanka",
  TW: "Taiwan", HK: "Hong Kong",
}

// Name → ISO alpha-2
const NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(CODE_TO_NAME).map(([k, v]) => [v, k])
)

// Country code → flag emoji
function flagEmoji(code: string): string {
  if (!code || code.length !== 2) return "  "
  const offset = 0x1f1e6 - 65
  return String.fromCodePoint(code.charCodeAt(0) + offset) +
    String.fromCodePoint(code.charCodeAt(1) + offset)
}

// Assign a stable color per country code
const COUNTRY_COLORS = [
  "#4285f4", "#fbbc04", "#34a853", "#ea4335",
  "#ff9800", "#00bcd4", "#9c27b0", "#e91e63",
  "#607d8b", "#795548", "#009688", "#3f51b5",
]

function countryColor(code: string): string {
  if (!code) return COUNTRY_COLORS[0]
  let h = 0
  for (let i = 0; i < code.length; i++) h = (h * 31 + code.charCodeAt(i)) >>> 0
  return COUNTRY_COLORS[h % COUNTRY_COLORS.length]
}

// Approximate lat/lon center for countries (subset)
const COUNTRY_COORDS: Record<string, [number, number]> = {
  US: [37.09, -95.71], CA: [56.13, -106.35], GB: [55.38, -3.44],
  DE: [51.17, 10.45], FR: [46.23, 2.21], IN: [20.59, 78.96],
  BR: [-14.24, -51.93], AU: [-25.27, 133.78], JP: [36.20, 138.25],
  CN: [35.86, 104.20], MX: [23.63, -102.55], ES: [40.46, -3.75],
  IT: [41.87, 12.57], NL: [52.13, 5.29], SE: [60.13, 18.64],
  CH: [46.82, 8.23], PL: [51.92, 19.15], RU: [61.52, 105.32],
  KR: [35.91, 127.77], SG: [1.35, 103.82], TH: [15.87, 100.99],
  VN: [14.06, 108.28], ID: [-0.79, 113.92], PH: [12.88, 121.77],
  MY: [4.21, 101.70], PK: [30.38, 69.35], NZ: [-40.90, 174.89],
  GR: [39.07, 21.82], PT: [39.40, -8.22], IE: [53.41, -8.24],
  DK: [56.26, 9.50], NO: [60.47, 8.47], FI: [61.92, 25.75],
  BE: [50.50, 4.47], AT: [47.52, 14.55], CZ: [49.82, 15.47],
  HU: [47.16, 19.50], RO: [45.94, 24.97], TR: [38.96, 35.24],
  EG: [26.82, 30.80], ZA: [-30.56, 22.94], SA: [23.89, 45.08],
  AE: [23.42, 53.85], AR: [-38.42, -63.62], CL: [-35.68, -71.54],
  CO: [4.57, -74.30], PE: [-9.19, -75.02], NG: [9.08, 8.68],
  KE: [-0.02, 37.91], UA: [48.38, 31.17], IL: [31.05, 34.85],
  BD: [23.69, 90.36], LK: [7.87, 80.77], TW: [23.70, 120.96],
  HK: [22.32, 114.17],
}

// Pixel dot world map — rows of lat/lon dots representing land masses
// Generated from a standard world map dot matrix (110×55 grid)
// Each row is a string of '.' (ocean) and 'X' (land)
const WORLD_DOTS: string[] = [
  "..........................................................................X.........................................................................",
  "..........................................................................XX........................................................................",
  "..........................................................................XX......................................X...................................",
  "..........................................................................XX......................................X...................................",
  ".........................................................................XXX......................................X...................................",
  ".......................................................................XXXXX.......................................X..................................",
  "........................................................................XXXX.......................................X.................................",
  "...............X.X.......................................................XXXXX....................................XXX..................................",
  ".................X.X.....................................................XXXXX....................................XXX.................................",
  "..................XX....................................................XXXXXX....................................XXX..................................",
  ".................XXX....................................................XXXXX....................................XXXX.................................",
  "..................XX....................................................XXXXXX...................................XXXXX................................",
  ".................XXX....................................................XXXXX...................................XXXXXX...............................",
  "................XXXX.................................................XXXXXXXX...................................XXXXXXX..............................",
  "................XXXXX................................................XXXXXXXX..................................XXXXXXXXX............................",
  "...............XXXXX.................................................XXXXXXXXXX................................XXXXXXXXX............................",
  "...............XXXXXX..............................................XXXXXXXXXX.................................XXXXXXXXX.............................",
  "..............XXXXXXX..............................................XXXXXXXXXX.................................XXXXXXXXX.............................",
  "..............XXXXXXXX.............................................XXXXXXXXXX.................................XXXXXXXXX.............................",
  "..............XXXXXXXXX............................................XXXXXXXXXX................................XXXXXXXXXX.............................",
  "...............XXXXXXXXXX.........................................XXXXXXXXXXX................................XXXXXXXXXX............................",
  ".................XXXXXXXXX........................................XXXXXXXXXXX................................XXXXXXXXXXX...........................",
  ".................XXXXXXXXXX.......................................XXXXXXXXXXXXX..............................XXXXXXXXXXXX..........................",
  "...................XXXXXXXXX.....................................XXXXXXXXXXXXXX..............................XXXXXXXXXXXX..........................",
  "...................XXXXXXXXXX....................................XXXXXXXXXXXXXX.............................XXXXXXXXXXXXX..........................",
  "....................XXXXXXXX....................................XXXXXXXXXXXXXXX.............................XXXXXXXXXXXXX.........................",
  "....................XXXXXXXX....................................XXXXXXXXXXXXXXXX............................XXXXXXXXXXXXX.........................",
  ".....................XXXXXXXX...................................XXXXXXXXXXXXXXXXX.............................XXXXXXXXXXX.........................",
  "......................XXXXXXXX..................................XXXXXXXXXXXXXXXXXX...........................XXXXXXXXXXXX.........................",
  ".......................XXXXXXXX.................................XXXXXXXXXXXXXXXXXXX..........................XXXXXXXXXX..........................",
  ".........................XXXXX.................................XXXXXXXXXXXXXXXXXXXX.........................XXXXXXXXXXX..........................",
  "..........................XXXXX................................XXXXXXXXXXXXXXXXXXXXX.........................XXXXXXXXX...........................",
  "..........................XXXXX................................XXXXXXXXXXXXXXXXXXXXXX........................XXXXXXXXX...........................",
  "..........................XXXXXX...............................XXXXXXXXXXXXXXXXXXXXXXX.......................XXXXXXXX............................",
  "..........................XXXXXXX.............................XXXXXXXXXXXXXXXXXXXXXXXX.......................XXXXXXXX............................",
  "...........................XXXXXXX...........................XXXXXXXXXXXXXXXXXXXXXXXXX.......................XXXXXXX.............................",
  "............................XXXXXX...........................XXXXXXXXXXXXXXXXXXXXXXXXXX......................XXXXXXX.............................",
  "............................XXXXXXX..........................XXXXXXXXXXXXXXXXXXXXXXXXXXX.....................XXXXXXXX............................",
  ".............................XXXXXXX.........................XXXXXXXXXXXXXXXXXXXXXXXXXXXX....................XXXXXXXXX...........................",
  "..............................XXXXXXX........................XXXXXXXXXXXXXXXXXXXXXXXXXXXX.....................XXXXXXXXX..........................",
  "..............................XXXXXXX.......................XXXXXXXXXXXXXXXXXXXXXXXXXXXXX.....................XXXXXXXXX..........................",
  "...............................XXXXXXX......................XXXXXXXXXXXXXXXXXXXXXXXXXXXXX....................XXXXXXXXXX..........................",
  "................................XXXXXXX.....................XXXXXXXXXXXXXXXXXXXXXXXXXXXXX....................XXXXXXXXXX..........................",
  ".................................XXXXXXX....................XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...................XXXXXXXXXX..........................",
  "..................................XXXXXXX...................XXXXXXXXXXXXXXXXXXXXXXXXXXXXXX...................XXXXXXXXX...........................",
  "...................................XXXXXXX..................XXXXXXXXXXXXXXXXXXXXXXXXXXXXX....................XXXXXXXXX...........................",
  "....................................XXXXXXX.................XXXXXXXXXXXXXXXXXXXXXXXXXXXX.....................XXXXXXXX...........................",
  ".....................................XXXXXXX................XXXXXXXXXXXXXXXXXXXXXXXXXXX......................XXXXXXX............................",
  "......................................XXXXXXXX..............XXXXXXXXXXXXXXXXXXXXXXXXXX.......................XXXXXX.............................",
  ".......................................XXXXXXXXX...........XXXXXXXXXXXXXXXXXXXXXXXXX.........................XXXXX..............................",
  "........................................XXXXXXXXXX.......XXXXXXXXXXXXXXXXXXXXXXXXXX..........................XXXX...............................",
  ".........................................XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX..........................XXXXX...............................",
  "..........................................XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX..........................XXXXXX..............................",
  "..........................................XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.........................XXXXXXXX.............................",
  "...........................................XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.........................XXXXXXXXX.............................",
  "............................................XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.........................XXXXXXXXX............................",
  ".............................................XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX........................XXXXXXXXXX............................",
]

// Better dot map using a proper bitmask of world land areas
// Using a 144 x 72 grid, each char = 2.5 degrees
const LAND_ROWS = 57
const LAND_COLS = 114

// Equirectangular projection helper
function latLonToPixel(
  lat: number,
  lon: number,
  width: number,
  height: number,
): [number, number] {
  const x = ((lon + 180) / 360) * width
  const y = ((90 - lat) / 180) * height
  return [x, y]
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

// Vercel edge region coordinates
const VERCEL_REGIONS: Array<{ name: string; lat: number; lon: number }> = [
  { name: "iad1", lat: 38.9, lon: -77.0 },
  { name: "sfo1", lat: 37.6, lon: -122.4 },
  { name: "pdx1", lat: 45.5, lon: -122.7 },
  { name: "lhr1", lat: 51.5, lon: -0.1 },
  { name: "fra1", lat: 50.1, lon: 8.7 },
  { name: "cdg1", lat: 48.9, lon: 2.4 },
  { name: "arn1", lat: 59.6, lon: 17.9 },
  { name: "sin1", lat: 1.4, lon: 103.8 },
  { name: "hkg1", lat: 22.3, lon: 114.2 },
  { name: "nrt1", lat: 35.8, lon: 140.4 },
  { name: "syd1", lat: -33.9, lon: 151.2 },
  { name: "bom1", lat: 19.1, lon: 72.9 },
  { name: "gru1", lat: -23.5, lon: -46.6 },
  { name: "cpt1", lat: -33.9, lon: 18.6 },
  { name: "dxb1", lat: 25.3, lon: 55.4 },
  { name: "icn1", lat: 37.5, lon: 126.8 },
  { name: "cle1", lat: 41.4, lon: -81.9 },
  { name: "sea1", lat: 47.4, lon: -122.3 },
  { name: "yul1", lat: 45.5, lon: -73.6 },
]

export function WorldMapVisualizer({ data, campaignName }: WorldMapVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { resolvedTheme } = useTheme()
  const [dimensions, setDimensions] = useState({ width: 900, height: 500 })
  const [mounted, setMounted] = useState(false)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; country: string; count: number; pct: number } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Observe container width
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width
      if (w > 0) setDimensions({ width: w, height: Math.round(w * 0.52) })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const isDark = resolvedTheme === "dark"

  // Build lookup: country name → data
  const dataMap = useMemo(() => {
    const m: Record<string, ContributionData> = {}
    for (const d of data) m[d.country] = d
    return m
  }, [data])

  const maxCount = useMemo(() => Math.max(...data.map((d) => d.count), 1), [data])
  const totalContributions = useMemo(() => data.reduce((s, d) => s + d.count, 0), [data])
  const topCountries = useMemo(() => data.slice(0, 7), [data])

  // Build dot positions for countries
  const countryDots = useMemo(() => {
    const dots: Array<{
      col: number; row: number; color: string; size: number;
      country: string; count: number; pct: number
    }> = []

    for (const [code, [lat, lon]] of Object.entries(COUNTRY_COORDS)) {
      const name = CODE_TO_NAME[code]
      if (!name) continue
      const item = dataMap[name]
      if (!item) continue

      const { width, height } = dimensions
      const dotW = width / LAND_COLS
      const dotH = height / LAND_ROWS

      const [px, py] = latLonToPixel(lat, lon, width, height)
      const col = Math.floor(px / dotW)
      const row = Math.floor(py / dotH)

      const spread = Math.max(1, Math.round((item.count / maxCount) * 5))
      const color = countryColor(code)

      for (let dr = -spread; dr <= spread; dr++) {
        for (let dc = -spread; dc <= spread; dc++) {
          if (Math.abs(dr) + Math.abs(dc) > spread + 1) continue
          const c = col + dc
          const r = row + dr
          if (c < 0 || r < 0 || c >= LAND_COLS || r >= LAND_ROWS) continue
          dots.push({ col: c, row: r, color, size: spread, country: name, count: item.count, pct: item.percentage })
        }
      }
    }
    return dots
  }, [dataMap, maxCount, dimensions])

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !mounted) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width, height } = dimensions
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)

    // Background
    ctx.fillStyle = isDark ? "#0a0a0a" : "#f0f4f0"
    ctx.fillRect(0, 0, width, height)

    const dotW = width / LAND_COLS
    const dotH = height / LAND_ROWS
    const dotSize = Math.max(1.5, Math.min(dotW, dotH) * 0.55)
    const gap = Math.max(0.5, dotSize * 0.3)

    // Draw base ocean/land dots
    for (let row = 0; row < LAND_ROWS; row++) {
      const rowStr = WORLD_DOTS[row] || ""
      for (let col = 0; col < LAND_COLS; col++) {
        const ch = rowStr[col] || "."
        const x = col * dotW + dotW / 2
        const y = row * dotH + dotH / 2

        if (ch === "X") {
          ctx.fillStyle = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)"
          ctx.fillRect(x - dotSize / 2, y - dotSize / 2, dotSize, dotSize)
        } else {
          ctx.fillStyle = isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"
          ctx.fillRect(x - dotSize / 2, y - dotSize / 2, dotSize * 0.6, dotSize * 0.6)
        }
      }
    }

    // Draw country contribution dots
    const dotMap = new Map<string, typeof countryDots[0]>()
    for (const d of countryDots) {
      const key = `${d.col},${d.row}`
      const existing = dotMap.get(key)
      if (!existing || d.count > existing.count) dotMap.set(key, d)
    }

    for (const [, dot] of dotMap) {
      const x = dot.col * dotW + dotW / 2
      const y = dot.row * dotH + dotH / 2
      const sz = dotSize * 1.1

      ctx.fillStyle = dot.color
      ctx.globalAlpha = 0.9
      ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz)
      ctx.globalAlpha = 1
    }

    // Draw Vercel region triangles
    for (const region of VERCEL_REGIONS) {
      const [px, py] = latLonToPixel(region.lat, region.lon, width, height)
      const ts = Math.max(5, dotSize * 1.8)
      ctx.beginPath()
      ctx.moveTo(px, py - ts)
      ctx.lineTo(px - ts * 0.75, py + ts * 0.5)
      ctx.lineTo(px + ts * 0.75, py + ts * 0.5)
      ctx.closePath()
      ctx.fillStyle = isDark ? "rgba(255,255,255,0.85)" : "rgba(40,40,40,0.75)"
      ctx.fill()
    }
  }, [mounted, isDark, dimensions, countryDots])

  // Mouse hover for tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const { width, height } = dimensions
    const dotW = width / LAND_COLS
    const dotH = height / LAND_ROWS

    let found: typeof countryDots[0] | null = null
    let bestDist = Infinity
    for (const d of countryDots) {
      const cx = d.col * dotW + dotW / 2
      const cy = d.row * dotH + dotH / 2
      const dist = Math.hypot(mx - cx, my - cy)
      if (dist < 20 && dist < bestDist) {
        bestDist = dist
        found = d
      }
    }

    if (found) {
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, country: found.country, count: found.count, pct: found.pct })
    } else {
      setTooltip(null)
    }
  }

  if (!mounted) {
    return (
      <div className="rounded-xl border border-border bg-muted/20 h-96 flex items-center justify-center">
        <p className="text-muted-foreground font-mono text-sm">Loading map...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Main map panel */}
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden border border-border/50"
        style={{ background: isDark ? "#0a0a0a" : "#f0f4f0" }}
      >
        {/* Stats overlay — top-left */}
        <div
          className="absolute top-4 left-4 z-10 font-mono select-none"
          style={{ color: isDark ? "rgba(255,255,255,0.9)" : "rgba(20,30,20,0.9)" }}
        >
          {campaignName && (
            <>
              <p className="text-xs tracking-widest uppercase opacity-70">{campaignName}</p>
              <p className="text-xs tracking-widest opacity-50 mb-3">[All time]</p>
            </>
          )}

          <p className="text-[10px] tracking-widest uppercase opacity-60 mb-1">Total Contributions</p>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight leading-none">
            {totalContributions.toLocaleString()}
          </p>

          {data.length > 0 && (
            <p className="text-xs opacity-50 mt-1 mb-4">{data.length} countries</p>
          )}

          {topCountries.length > 0 && (
            <>
              <p className="text-[10px] tracking-widest uppercase opacity-60 mb-2">Top Countries by Contributions</p>
              <div className="flex flex-col gap-1">
                {topCountries.map((item) => {
                  const code = NAME_TO_CODE[item.country] || "??"
                  const color = countryColor(code)
                  return (
                    <div key={item.country} className="flex items-center gap-2 text-xs">
                      <span
                        className="inline-block shrink-0"
                        style={{
                          width: 10, height: 10,
                          background: color,
                          display: "inline-block",
                        }}
                      />
                      <span className="opacity-80 w-7 shrink-0">{code}</span>
                      <span className="opacity-90 font-semibold tabular-nums">
                        {item.count.toLocaleString()}
                      </span>
                      <span className="opacity-50 tabular-nums">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Vercel regions legend */}
          <div className="flex items-center gap-2 mt-4 text-[10px] opacity-60">
            <svg width="10" height="10" viewBox="0 0 10 10">
              <polygon points="5,0 10,10 0,10" fill={isDark ? "white" : "#333"} />
            </svg>
            <span>{VERCEL_REGIONS.length} Edge Regions</span>
          </div>
        </div>

        {/* Canvas map */}
        <canvas
          ref={canvasRef}
          style={{ display: "block", width: "100%", height: dimensions.height }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setTooltip(null)}
        />

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-20 pointer-events-none rounded px-2 py-1 text-xs font-mono shadow-lg border border-border/50"
            style={{
              left: tooltip.x + 12,
              top: tooltip.y - 30,
              background: isDark ? "rgba(0,0,0,0.85)" : "rgba(255,255,255,0.92)",
              color: isDark ? "#fff" : "#111",
            }}
          >
            <span className="font-semibold">{tooltip.country}</span>
            {" · "}
            {tooltip.count.toLocaleString()} ({tooltip.pct.toFixed(1)}%)
          </div>
        )}
      </div>

      {/* Bottom country bar strip */}
      {topCountries.length > 0 && (
        <div
          className="flex flex-wrap gap-3 px-4 py-3 rounded-xl border border-border/50 font-mono text-xs"
          style={{ background: isDark ? "rgba(0,0,0,0.4)" : "rgba(240,244,240,0.8)" }}
          aria-label="Top contributing countries"
        >
          {topCountries.map((item) => {
            const code = NAME_TO_CODE[item.country] || "??"
            const color = countryColor(code)
            const widthPct = (item.count / topCountries[0].count) * 100
            return (
              <div key={item.country} className="flex items-center gap-2 min-w-[160px] max-w-xs flex-1">
                <span
                  className="shrink-0"
                  style={{ width: 10, height: 10, background: color, display: "inline-block" }}
                />
                <span className="opacity-70 w-6 shrink-0">{code}</span>
                <div className="flex-1 flex flex-col gap-0.5">
                  <div className="flex justify-between">
                    <span className="text-foreground font-semibold">{item.count.toLocaleString()}</span>
                    <span className="opacity-50">{item.percentage.toFixed(1)}%</span>
                  </div>
                  <div
                    className="h-0.5 rounded"
                    style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)", width: "100%" }}
                  >
                    <div
                      className="h-full rounded"
                      style={{ width: `${widthPct}%`, background: color }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
