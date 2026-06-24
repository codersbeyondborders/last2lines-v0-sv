import { ImageResponse } from "next/og"
import { getCampaignBySlug } from "@/lib/queries"

// Use Node.js runtime for OG images because database queries require Node.js modules
// (AWS SDK dependencies). Edge runtime doesn't support these.

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export async function generateAltText({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const campaign = await getCampaignBySlug(slug)
  return campaign
    ? `${campaign.title} — Last2Lines`
    : "Campaign — Last2Lines"
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const campaign = await getCampaignBySlug(slug)

  const title = campaign?.title ?? "Campaign"
  const tagline = campaign?.tagline ?? "A living poem written by the world."

  // Derive a phase label for the badge
  const now = new Date()
  let phaseLabel = "Active"
  if (campaign) {
    const start = new Date(campaign.startDate)
    const close = new Date(campaign.closeDate)
    if (now < start) phaseLabel = "Upcoming"
    else if (now > close) phaseLabel = "Completed"
  }

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
        {/* Top: wordmark + phase badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
          <div
            style={{
              background: "#166534",
              borderRadius: "999px",
              padding: "8px 20px",
              color: "#4ade80",
              fontSize: "16px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            {phaseLabel}
          </div>
        </div>

        {/* Middle: campaign title */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              color: "#86efac",
              fontSize: "18px",
              fontWeight: 500,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Campaign
          </div>
          <div
            style={{
              color: "#f0fdf4",
              fontSize: title.length > 40 ? "52px" : "64px",
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: "950px",
            }}
          >
            {title}
          </div>
        </div>

        {/* Bottom: tagline */}
        <div
          style={{
            color: "#86efac",
            fontSize: "24px",
            lineHeight: 1.5,
            maxWidth: "800px",
          }}
        >
          {tagline}
        </div>
      </div>
    ),
    { ...size },
  )
}
