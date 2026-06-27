"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, BookOpen, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Contribution } from "@/lib/mock-data"

type DisplayCouplet = Contribution & { isSeed?: boolean }

interface FullPoemViewProps {
  couplets: DisplayCouplet[]
  campaignSlug: string
  campaignTitle: string
  isOpen: boolean
}

export function FullPoemView({
  couplets,
  campaignSlug,
  campaignTitle,
  isOpen,
}: FullPoemViewProps) {
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return couplets
    return couplets.filter((c) => {
      const text = `${c.lineOne} ${c.lineTwo}`.toLowerCase()
      const author = (c.authorName ?? "anonymous").toLowerCase()
      return text.includes(q) || author.includes(q)
    })
  }, [query, couplets])

  return (
    <div className="flex flex-col gap-8">
      {/* Breadcrumb nav */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/#campaigns"
          className="inline-flex items-center gap-1 rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          All campaigns
        </Link>
        <span aria-hidden="true" className="text-border">/</span>
        <Link
          href={`/campaign/${campaignSlug}`}
          className="inline-flex items-center gap-1 rounded-md transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {campaignTitle}
        </Link>
        <span aria-hidden="true" className="text-border">/</span>
        <span className="text-foreground font-medium">Full poem</span>
      </nav>

      {/* Search */}
      <div className="relative">
        <label htmlFor="couplet-search" className="sr-only">
          Search couplets by text or author
        </label>
        <Search
          className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          id="couplet-search"
          type="search"
          placeholder="Search by text or author name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9 pr-9"
          aria-controls="poem-list"
          aria-label="Search couplets by text or author"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
            aria-label="Clear search"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Result count */}
      <p
        aria-live="polite"
        className="text-sm text-muted-foreground -mt-4"
      >
        {query
          ? `${filtered.length} of ${couplets.length} couplets match`
          : `${couplets.length} couplet${couplets.length !== 1 ? "s" : ""} in this poem`}
      </p>

      {/* Poem */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-6 py-14 text-center">
          <p className="font-serif text-lg font-medium">No couplets found</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground text-pretty">
            Try a different search term or clear the filter to see all couplets.
          </p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => setQuery("")}>
            Clear search
          </Button>
        </div>
      ) : (
        <article
          id="poem-list"
          aria-label={`Full poem: ${campaignTitle}`}
          className="rounded-2xl border border-border/70 bg-card px-6 py-10 ring-1 ring-foreground/5 sm:px-12 sm:py-14"
        >
          <ol className="flex flex-col">
            {filtered.map((couplet, index) => (
              <CoupletItem
                key={couplet.id}
                couplet={couplet}
                isLast={index === filtered.length - 1}
                query={query}
              />
            ))}
          </ol>
        </article>
      )}

      {/* Write CTA — only shown when campaign is open */}
      {isOpen && (
        <div className="flex justify-center pt-2 pb-4">
          <Button size="lg" nativeButton={false} render={
            <Link href={`/campaign/${campaignSlug}#contribute`}>
              Write your two lines
            </Link>
          } />
        </div>
      )}
    </div>
  )
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query.trim()) return text
  const q = query.trim()
  const regex = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi")
  const parts = text.split(regex)
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-primary/20 text-foreground rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

function CoupletItem({
  couplet,
  isLast,
  query,
}: {
  couplet: DisplayCouplet
  isLast: boolean
  query: string
}) {
  const author = couplet.authorName?.trim() || "Anonymous"

  return (
    <li className={isLast ? "pb-0" : "mb-7 border-b border-border/40 pb-7"}>
      <p className="font-serif text-pretty text-xl leading-relaxed text-foreground sm:text-2xl">
        {highlight(couplet.lineOne, query)}
        <br />
        {highlight(couplet.lineTwo, query)}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        <span aria-hidden="true">— </span>
        <cite className="not-italic font-medium text-foreground/80">
          {highlight(author, query)}
        </cite>
        {couplet.country ? (
          <span className="text-muted-foreground">, {couplet.country}</span>
        ) : null}
      </p>
    </li>
  )
}
