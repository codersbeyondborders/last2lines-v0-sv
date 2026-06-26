"use client"

import { useEffect, useState } from "react"

interface SocialShareProps {
  title: string
  tagline: string
  slug: string
}

interface ShareLink {
  label: string
  href: (url: string, text: string) => string
  icon: React.ReactNode
  /** Accessible brand colour used only for the icon itself */
  color: string
}

// Inline SVG brand icons — keeps the bundle zero-dependency
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.553 4.103 1.523 5.827L.057 23.854a.5.5 0 0 0 .609.609l6.098-1.467A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 0 1-5.006-1.37l-.358-.213-3.722.896.913-3.635-.234-.373A9.818 9.818 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-current">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

const SHARE_LINKS: ShareLink[] = [
  {
    label: "Share on WhatsApp",
    color: "#25D366",
    icon: <WhatsAppIcon />,
    href: (url, text) =>
      `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`,
  },
  {
    label: "Share on X",
    color: "#000000",
    icon: <XIcon />,
    href: (url, text) =>
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    label: "Share on Facebook",
    color: "#1877F2",
    icon: <FacebookIcon />,
    href: (url, _text) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    label: "Share on LinkedIn",
    color: "#0A66C2",
    icon: <LinkedInIcon />,
    href: (url, text) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`,
  },
]

export function SocialShare({ title, tagline, slug }: SocialShareProps) {
  const [pageUrl, setPageUrl] = useState("")

  // Build the canonical URL client-side so SSR never serialises window.location.
  useEffect(() => {
    setPageUrl(`${window.location.origin}/campaign/${slug}`)
  }, [slug])

  const shareText = `"${title}" — ${tagline} · Add your two lines to the poem:`

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        Share
      </span>
      {SHARE_LINKS.map(({ label, href, icon, color }) => (
        <a
          key={label}
          href={pageUrl ? href(pageUrl, shareText) : "#"}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          title={label}
          style={{ color }}
          className="inline-flex size-8 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {icon}
        </a>
      ))}
    </div>
  )
}
