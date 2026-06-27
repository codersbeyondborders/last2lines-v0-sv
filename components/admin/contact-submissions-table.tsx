"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  MoreHorizontal,
  Inbox,
  Loader2,
  Trash2,
  Eye,
  Archive,
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
  MailOpen,
} from "lucide-react"
import type { ContactSubmission } from "@/lib/queries"
import {
  updateContactStatus,
  deleteContactSubmission,
  type ContactStatus,
} from "@/lib/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<ContactSubmission["type"], string> = {
  campaign_request: "Campaign Request",
  feedback: "Feedback",
  concern: "Concern",
  general: "General",
}

const TYPE_VARIANTS: Record<ContactSubmission["type"], string> = {
  campaign_request: "bg-primary/10 text-primary border-primary/20",
  feedback:        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  concern:         "bg-destructive/10 text-destructive border-destructive/20",
  general:         "bg-muted text-muted-foreground border-border",
}

const STATUS_VARIANTS: Record<ContactSubmission["status"], string> = {
  new:      "bg-primary/10 text-primary border-primary/20",
  read:     "bg-muted text-muted-foreground border-border",
  archived: "bg-muted/50 text-muted-foreground/60 border-border",
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ContactSubmissionsTableProps {
  initialItems: ContactSubmission[]
  total: number
  currentPage: number
  pageSize: number
  initialStatus: string
  initialType: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContactSubmissionsTable({
  initialItems,
  total,
  currentPage,
  pageSize,
  initialStatus,
  initialType,
}: ContactSubmissionsTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [items, setItems] = useState(initialItems)
  const [error, setError] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<ContactSubmission | null>(null)
  const [viewing, setViewing] = useState<ContactSubmission | null>(null)
  const [statusFilter, setStatusFilter] = useState(initialStatus || "all")
  const [typeFilter, setTypeFilter] = useState(initialType || "all")

  // Sync with server re-renders
  useEffect(() => { setItems(initialItems) }, [initialItems])

  const totalPages = Math.ceil(total / pageSize)

  // ---------------------------------------------------------------------------
  // URL navigation helper
  // ---------------------------------------------------------------------------
  function navigate(overrides: Partial<{ status: string; type: string; page: number }>) {
    const params = new URLSearchParams(searchParams.toString())
    const next = { status: statusFilter, type: typeFilter, page: currentPage, ...overrides }
    next.status === "all" ? params.delete("status") : params.set("status", next.status)
    next.type   === "all" ? params.delete("type")   : params.set("type", next.type)
    next.page   <= 1      ? params.delete("page")   : params.set("page", String(next.page))
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------
  async function markStatus(id: string, status: ContactStatus) {
    setError(null)
    const prev = [...items]
    setItems((cur) => cur.map((i) => i.id === id ? { ...i, status } : i))
    const result = await updateContactStatus(id, status)
    if (!result.ok) { setItems(prev); setError(result.error ?? "Failed to update.") }
    if (viewing?.id === id) setViewing((v) => v ? { ...v, status } : v)
  }

  async function handleDelete(item: ContactSubmission) {
    setError(null)
    setPendingDelete(null)
    const snapshot = [...items]
    setItems((cur) => cur.filter((i) => i.id !== item.id))
    const result = await deleteContactSubmission(item.id)
    if (!result.ok) {
      setItems(snapshot)
      setError(result.error ?? "Failed to delete.")
    }
  }

  // Open detail and auto-mark as read
  function openDetail(item: ContactSubmission) {
    setViewing(item)
    if (item.status === "new") markStatus(item.id, "read")
  }

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    })
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col gap-4">
      {/* Error banner */}
      {error && (
        <div
          role="alert"
          aria-live="polite"
          className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {error}
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto text-destructive/70 hover:text-destructive"
            aria-label="Dismiss error"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="status-filter" className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <Select
            value={statusFilter}
            onValueChange={(v: string | null) => {
              const val = v ?? "all"
              setStatusFilter(val)
              navigate({ status: val, page: 1 })
            }}
          >
            <SelectTrigger id="status-filter" className="h-9 w-36">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="read">Read</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Type filter */}
        <div className="flex flex-col gap-1">
          <label htmlFor="type-filter" className="text-xs font-medium text-muted-foreground">
            Type
          </label>
          <Select
            value={typeFilter}
            onValueChange={(v: string | null) => {
              const val = v ?? "all"
              setTypeFilter(val)
              navigate({ type: val, page: 1 })
            }}
          >
            <SelectTrigger id="type-filter" className="h-9 w-44">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="campaign_request">Campaign Request</SelectItem>
              <SelectItem value="feedback">Feedback</SelectItem>
              <SelectItem value="concern">Concern</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Spinner + clear */}
        <div className="flex items-end gap-2 pb-0.5">
          {isPending && (
            <Loader2 className="size-4 animate-spin self-center text-muted-foreground" aria-hidden="true" />
          )}
          {(statusFilter !== "all" || typeFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="self-end"
              onClick={() => {
                setStatusFilter("all")
                setTypeFilter("all")
                navigate({ status: "all", type: "all", page: 1 })
              }}
            >
              <X className="size-4" aria-hidden="true" />
              Clear
            </Button>
          )}
        </div>

        <p
          className="ml-auto self-end text-xs text-muted-foreground"
          aria-live="polite"
          aria-atomic="true"
        >
          {total} {total === 1 ? "submission" : "submissions"}
        </p>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card py-16 text-center">
          <Inbox className="size-10 text-muted-foreground/40" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">No submissions found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">From</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Subject / Campaign</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground lg:table-cell">Date</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    "border-b border-border last:border-0 transition-colors hover:bg-muted/30",
                    item.status === "new" && "bg-primary/5 hover:bg-primary/10",
                  )}
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => openDetail(item)}
                      className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      <p className={cn("font-medium", item.status === "new" && "font-semibold")}>
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{item.email}</p>
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", TYPE_VARIANTS[item.type])}>
                      {TYPE_LABELS[item.type]}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <p className="max-w-xs truncate text-muted-foreground">
                      {item.campaignName ?? item.subject ?? "—"}
                    </p>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize", STATUS_VARIANTS[item.status])}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button variant="ghost" size="icon" aria-label={`Actions for submission from ${item.name}`}>
                            <MoreHorizontal className="size-4" aria-hidden="true" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openDetail(item)}>
                          <Eye className="size-4" aria-hidden="true" />
                          View message
                        </DropdownMenuItem>
                        {item.status !== "read" && (
                          <DropdownMenuItem onClick={() => markStatus(item.id, "read")}>
                            <MailOpen className="size-4" aria-hidden="true" />
                            Mark as read
                          </DropdownMenuItem>
                        )}
                        {item.status !== "archived" && (
                          <DropdownMenuItem onClick={() => markStatus(item.id, "archived")}>
                            <Archive className="size-4" aria-hidden="true" />
                            Archive
                          </DropdownMenuItem>
                        )}
                        {item.status === "archived" && (
                          <DropdownMenuItem onClick={() => markStatus(item.id, "read")}>
                            <MailOpen className="size-4" aria-hidden="true" />
                            Unarchive
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setPendingDelete(item)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="flex items-center justify-between gap-2 pt-1"
        >
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => navigate({ page: currentPage - 1 })}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Previous
          </Button>

          <div className="flex items-center gap-1" role="list" aria-label="Page numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…")
                acc.push(p)
                return acc
              }, [])
              .map((p, idx) =>
                p === "…" ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground text-sm" aria-hidden="true">…</span>
                ) : (
                  <Button
                    key={p}
                    role="listitem"
                    variant={p === currentPage ? "default" : "outline"}
                    size="sm"
                    className="size-9"
                    onClick={() => navigate({ page: p as number })}
                    aria-label={`Page ${p}`}
                    aria-current={p === currentPage ? "page" : undefined}
                  >
                    {p}
                  </Button>
                ),
              )}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => navigate({ page: currentPage + 1 })}
            aria-label="Next page"
          >
            Next
            <ChevronRight className="size-4" aria-hidden="true" />
          </Button>
        </nav>
      )}

      {/* Detail dialog */}
      {viewing && (
        <Dialog open onOpenChange={() => setViewing(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-base">
                <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", TYPE_VARIANTS[viewing.type])}>
                  {TYPE_LABELS[viewing.type]}
                </span>
                {viewing.campaignName ?? viewing.subject ?? "Message"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                From {viewing.name} &lt;{viewing.email}&gt; &nbsp;·&nbsp; {formatDate(viewing.createdAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="mt-1 rounded-lg border border-border bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
              {viewing.message}
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex gap-2">
                {viewing.status !== "read" && (
                  <Button size="sm" variant="outline" onClick={() => markStatus(viewing.id, "read")}>
                    <MailOpen className="size-4" aria-hidden="true" />
                    Mark read
                  </Button>
                )}
                {viewing.status !== "archived" && (
                  <Button size="sm" variant="outline" onClick={() => markStatus(viewing.id, "archived")}>
                    <Archive className="size-4" aria-hidden="true" />
                    Archive
                  </Button>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={() => { setViewing(null); setPendingDelete(viewing) }}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete confirmation */}
      {pendingDelete && (
        <AlertDialog open onOpenChange={() => setPendingDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete submission?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the {TYPE_LABELS[pendingDelete.type].toLowerCase()} from{" "}
                <strong>{pendingDelete.name}</strong>. This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(pendingDelete)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
