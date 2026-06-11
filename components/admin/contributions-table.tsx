"use client"

import { useMemo, useState } from "react"
import {
  Check,
  X,
  Trash2,
  Pencil,
  Loader2,
  MoreHorizontal,
  AlertCircle,
} from "lucide-react"
import {
  MOCK_CONTRIBUTIONS,
  MOCK_CAMPAIGNS,
  type Contribution,
  type ContributionStatus,
} from "@/lib/mock-data"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ContributionStatusBadge } from "@/components/admin/status-badges"
import { cn } from "@/lib/utils"

type FilterKey = ContributionStatus | "all"

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
]

const CAMPAIGN_TITLE = new Map(MOCK_CAMPAIGNS.map((c) => [c.id, c.title]))

export function ContributionsTable({
  authorId,
}: {
  authorId?: string
}) {
  const [items, setItems] = useState<Contribution[]>(() => [
    ...MOCK_CONTRIBUTIONS,
  ])
  const [filter, setFilter] = useState<FilterKey>("all")
  const [actingId, setActingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Inline edit state.
  const [editing, setEditing] = useState<Contribution | null>(null)
  const [editLineOne, setEditLineOne] = useState("")
  const [editLineTwo, setEditLineTwo] = useState("")

  const counts = useMemo(() => {
    const base = authorId
      ? items.filter((c) => c.authorId === authorId)
      : items
    return {
      all: base.length,
      pending: base.filter((c) => c.status === "pending").length,
      approved: base.filter((c) => c.status === "approved").length,
      rejected: base.filter((c) => c.status === "rejected").length,
    }
  }, [items, authorId])

  const visible = useMemo(() => {
    let base = authorId ? items.filter((c) => c.authorId === authorId) : items
    if (filter !== "all") base = base.filter((c) => c.status === filter)
    return [...base].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }, [items, filter, authorId])

  function moderate(
    id: string,
    status: ContributionStatus,
    reason: string | null,
  ) {
    setError(null)
    setActingId(id)
    setItems((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status, moderationReason: reason } : c,
      ),
    )
    window.setTimeout(() => setActingId(null), 300)
  }

  function remove(id: string) {
    setError(null)
    setItems((prev) => prev.filter((c) => c.id !== id))
  }

  function openEdit(c: Contribution) {
    setEditing(c)
    setEditLineOne(c.lineOne)
    setEditLineTwo(c.lineTwo)
  }

  function saveEdit() {
    if (!editing) return
    const id = editing.id
    setItems((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, lineOne: editLineOne.trim(), lineTwo: editLineTwo.trim() }
          : c,
      ),
    )
    setEditing(null)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div
        role="tablist"
        aria-label="Filter contributions by AI status"
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

      {visible.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          No contributions match this view.
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-right">#</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Author</TableHead>
                <TableHead className="min-w-64">Couplet</TableHead>
                <TableHead>AI Status</TableHead>
                <TableHead className="min-w-40">AI Feedback</TableHead>
                <TableHead className="w-12 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody aria-live="polite">
              {visible.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {c.sequenceNumber || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {CAMPAIGN_TITLE.get(c.campaignId) ?? "—"}
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      {c.authorName ?? "Anonymous"}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-sm">
                    <div className="flex flex-col font-serif leading-snug whitespace-normal">
                      <span className="break-words">{c.lineOne}</span>
                      <span className="break-words">{c.lineTwo}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <ContributionStatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <span className="block max-w-48 whitespace-normal text-pretty">
                      {c.moderationReason ??
                        (c.status === "approved"
                          ? "Auto-approved"
                          : c.status === "pending"
                            ? "Awaiting review"
                            : "—")}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={actingId === c.id}
                            aria-label={`Actions for couplet by ${c.authorName ?? "anonymous"}`}
                          >
                            {actingId === c.id ? (
                              <Loader2
                                className="size-4 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <MoreHorizontal
                                className="size-4"
                                aria-hidden="true"
                              />
                            )}
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        {c.status !== "approved" ? (
                          <DropdownMenuItem
                            onClick={() => moderate(c.id, "approved", null)}
                          >
                            <Check className="size-4" aria-hidden="true" />
                            Approve
                          </DropdownMenuItem>
                        ) : null}
                        {c.status !== "rejected" ? (
                          <DropdownMenuItem
                            onClick={() =>
                              moderate(
                                c.id,
                                "rejected",
                                "Rejected by moderator",
                              )
                            }
                          >
                            <X className="size-4" aria-hidden="true" />
                            Reject
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem onClick={() => openEdit(c)}>
                          <Pencil className="size-4" aria-hidden="true" />
                          Edit lines
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => remove(c.id)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Inline edit panel */}
      {editing ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-title"
        >
          <Card className="w-full max-w-lg">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                saveEdit()
              }}
              className="flex flex-col gap-4 p-6"
            >
              <h2
                id="edit-title"
                className="font-serif text-lg font-semibold tracking-tight"
              >
                Edit couplet
              </h2>
              <p className="text-sm text-muted-foreground">
                Fix a typo without rejecting the submission. The author and
                status are unchanged.
              </p>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-line-1">First line</Label>
                <Input
                  id="edit-line-1"
                  value={editLineOne}
                  maxLength={100}
                  onChange={(e) => setEditLineOne(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-line-2">Second line</Label>
                <Input
                  id="edit-line-2"
                  value={editLineTwo}
                  maxLength={100}
                  onChange={(e) => setEditLineTwo(e.target.value)}
                />
              </div>
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!editLineOne.trim() || !editLineTwo.trim()}
                >
                  Save
                </Button>
              </div>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
