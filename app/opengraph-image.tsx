import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "Last2Lines — Two lines from you. One poem for every cause."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#152b22",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* Top: wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "#4ade80",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          />
          <span
            style={{
              color: "#d1fae5",
              fontSize: "20px",
              fontWeight: 600,
              letterSpacing: "0.02em",
            }}
          >
            Last2Lines
          </span>
        </div>

        {/* Middle: headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              color: "#4ade80",
              fontSize: "18px",
              fontWeight: 500,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            The collective poetry project
          </div>
          <div
            style={{
              color: "#f0fdf4",
              fontSize: "64px",
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: "900px",
            }}
          >
            Two lines from you. One poem for every cause.
          </div>
        </div>

        {/* Bottom: tagline */}
        <div
          style={{
            color: "#86efac",
            fontSize: "22px",
            lineHeight: 1.5,
            maxWidth: "700px",
          }}
        >
          Add your couplet to a living tapestry of collective voice — turning
          individual whispers into a global chorus for social good.
        </div>
      </div>
    ),
    { ...size },
  )
}
