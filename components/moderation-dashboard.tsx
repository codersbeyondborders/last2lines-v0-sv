"use client"

import { useMemo, useState } from "react"
import {
  Check,
  X,
  RotateCcw,
  Loader2,
  Inbox,
  AlertCircle,
  Clock,
  ShieldCheck,
  Mail,
  MapPin,
} from "lucide-react"
import {
  MOCK_CONTRIBUTIONS,
  type Contribution,
  type ContributionStatus,
} from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type FilterKey = ContributionStatus | "all"

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
]

const STATUS_META: Record<
  ContributionStatus,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  approved: { label: "Approved", variant: "default" },
  pending: { label: "Pending", variant: "secondary" },
  rejected: { label: "Rejected", variant: "destructive" },
}

export function ModerationDashboard() {
  // High-fidelity local state mirrors the production payload; mutated optimistically.
  const [items, setItems] = useState<Contribution[]>(() => [
    ...MOCK_CONTRIBUTIONS,
  ])
  const [filter, setFilter] = useState<FilterKey>("pending")
  // Track which row is mid-action so we can show a spinner without blocking the rest.
  const [actingId, setActingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const counts = useMemo(
    () => ({
      pending: items.filter((c) => c.status === "pending").length,
      approved: items.filter((c) => c.status === "approved").length,
      rejected: items.filter((c) => c.status === "rejected").length,
      all: items.length,
    }),
    [items],
  )

  const visible = useMemo(
    () =>
      (filter === "all"
        ? items
        : items.filter((c) => c.status === filter)
      ).sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [items, filter],
  )

  function moderate(
    id: string,
    status: ContributionStatus,
    reason: string | null,
  ) {
    setError(null)
    setActingId(id)
    // Optimistically mutate local state to simulate a successful server update.
    setItems((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status, moderationReason: reason } : c,
      ),
    )
    // Brief delay only to surface the per-row spinner; no real request in Phase 2.
    window.setTimeout(() => setActingId(null), 350)
  }

  return (
    <div className="flex flex-col gap-6">
      <StatStrip counts={counts} />

      {/* Filters */}
      <div
        role="tablist"
        aria-label="Filter contributions by status"
        className="flex flex-wrap items-center gap-2"
      >
        {FILTERS.map((f) => {
          const active = filter === f.key
          return (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  active
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {counts[f.key]}
              </span>
            </button>
          )
        })}
      </div>

      {error ? (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}

      {/* Queue */}
      {visible.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <ul className="flex flex-col gap-4" aria-live="polite">
          {visible.map((item) => (
            <li key={item.id}>
              <ContributionRow
                item={item}
                acting={actingId === item.id}
                onApprove={() => moderate(item.id, "approved", null)}
                onReject={() =>
                  moderate(item.id, "rejected", "Rejected by moderator")
                }
                onReset={() => moderate(item.id, "pending", null)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function StatStrip({
  counts,
}: {
  counts: { pending: number; approved: number; rejected: number; all: number }
}) {
  const stats = [
    { label: "Awaiting review", value: counts.pending, icon: Clock },
    { label: "In the poem", value: counts.approved, icon: ShieldCheck },
    { label: "Rejected", value: counts.rejected, icon: X },
  ]
  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <s.icon className="size-4" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <dt className="text-sm text-muted-foreground">{s.label}</dt>
            <dd className="font-serif text-2xl font-semibold tabular-nums">
              {s.value}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  )
}

function ContributionRow({
  item,
  acting,
  onApprove,
  onReject,
  onReset,
}: {
  item: Contribution
  acting: boolean
  onApprove: () => void
  onReject: () => void
  onReset: () => void
}) {
  const meta = STATUS_META[item.status]
  return (
    <Card size="default" className="overflow-hidden">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={meta.variant}>{meta.label}</Badge>
            {item.moderationReason ? (
              <span className="text-xs text-muted-foreground">
                {item.moderationReason}
              </span>
            ) : null}
          </div>

          <blockquote className="border-l-2 border-primary/40 pl-4 font-serif text-lg leading-relaxed text-pretty">
            <p className="break-words">{item.lineOne}</p>
            <p className="break-words">{item.lineTwo}</p>
          </blockquote>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">
              {item.authorName ?? "Anonymous"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Mail className="size-3" aria-hidden="true" />
              {item.authorEmail}
            </span>
            {item.country ? (
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" aria-hidden="true" />
                {item.country}
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-stretch">
          {item.status !== "approved" ? (
            <Button
              size="sm"
              onClick={onApprove}
              disabled={acting}
              aria-label={`Approve couplet by ${item.authorName ?? "anonymous"}`}
            >
              {acting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="size-4" aria-hidden="true" />
              )}
              Approve
            </Button>
          ) : null}

          {item.status !== "rejected" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              disabled={acting}
              aria-label={`Reject couplet by ${item.authorName ?? "anonymous"}`}
            >
              <X className="size-4" aria-hidden="true" />
              Reject
            </Button>
          ) : null}

          {item.status !== "pending" ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={onReset}
              disabled={acting}
              aria-label={`Return couplet by ${item.authorName ?? "anonymous"} to the queue`}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Requeue
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ filter }: { filter: FilterKey }) {
  const message =
    filter === "pending"
      ? "The queue is clear. Every couplet has been reviewed."
      : filter === "approved"
        ? "No approved couplets yet."
        : filter === "rejected"
          ? "Nothing has been rejected."
          : "No contributions to show."
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Inbox className="size-6" aria-hidden="true" />
      </span>
      <p className="text-pretty text-muted-foreground">{message}</p>
    </div>
  )
}
