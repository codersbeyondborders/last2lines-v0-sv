"use client"

import { useCallback, useState, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Ban,
  ShieldCheck,
  FileText,
  MoreHorizontal,
  AlertCircle,
  Loader2,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react"
import { type Author } from "@/lib/mock-data"
import { setAuthorStatus, fetchAuthorsPage, deleteAuthor } from "@/lib/actions"
import type { GetAuthorsOptions, AuthorFilterOptions } from "@/lib/queries"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { AuthorStatusBadge } from "@/components/admin/status-badges"

const PAGE_SIZE = 20

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

export function AuthorsTable({
  initialAuthors,
  total,
  currentPage,
  submissionCounts,
  filterOptions,
  initialSearch,
  initialCampaign,
  initialCountry,
}: {
  initialAuthors: Author[]
  total: number
  currentPage: number
  submissionCounts: Record<string, number>
  filterOptions: AuthorFilterOptions
  initialSearch: string
  initialCampaign: string
  initialCountry: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [authors, setAuthors] = useState<Author[]>(initialAuthors)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deletingId, startDelete] = useTransition()
  const [pendingDelete, setPendingDelete] = useState<Author | null>(null)

  // Controlled filter state — drives URL params on submit.
  const [search, setSearch] = useState(initialSearch)
  const [campaign, setCampaign] = useState(initialCampaign || "all")
  const [country, setCountry] = useState(initialCountry || "all")

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // ── URL-driven navigation ──────────────────────────────────────────────────
  function buildParams(overrides: Record<string, string>) {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(overrides)) {
      if (v && v !== "all") {
        p.set(k, v)
      } else {
        p.delete(k)
      }
    }
    return p.toString()
  }

  function applyFilters(overrides: Record<string, string> = {}) {
    const params = buildParams({
      search,
      campaign,
      country,
      page: "1",
      ...overrides,
    })
    startTransition(() => {
      router.push(`${pathname}?${params}`)
    })
  }

  function goToPage(page: number) {
    const params = buildParams({ page: String(page) })
    startTransition(() => {
      router.push(`${pathname}?${params}`)
    })
  }

  function clearFilters() {
    setSearch("")
    setCampaign("all")
    setCountry("all")
    startTransition(() => {
      router.push(pathname)
    })
  }

  const hasActiveFilters =
    !!initialSearch || (!!initialCampaign && initialCampaign !== "all") || (!!initialCountry && initialCountry !== "all")

  // ── Per-row status toggle ──────────────────────────────────────────────────
  async function setStatus(id: string, status: Author["status"]) {
    setError(null)
    const previous = authors
    setAuthors((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    const result = await setAuthorStatus({ id, status })
    if (!result.ok) {
      setAuthors(previous)
      setError(result.error ?? "Could not update this author.")
    }
  }

  // ── Delete flow ────────────────────────────────────────────────────────────
  function handleDeleteConfirmed() {
    if (!pendingDelete) return
    const id = pendingDelete.id
    setAuthors((prev) => prev.filter((a) => a.id !== id))
    setPendingDelete(null)
    setError(null)
    startDelete(async () => {
      const result = await deleteAuthor(id)
      if (!result.ok) {
        setError(result.error ?? "Could not delete this author.")
      }
    })
  }

  const submissionCount = pendingDelete
    ? (submissionCounts[pendingDelete.id] ?? 0)
    : 0

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
        {/* Search */}
        <div className="flex flex-col gap-1.5 min-w-0 flex-1 sm:max-w-xs">
          <Label htmlFor="author-search" className="text-xs text-muted-foreground">
            Search
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="author-search"
              type="search"
              placeholder="Name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") applyFilters({ search: e.currentTarget.value })
              }}
              className="pl-9"
              aria-label="Search authors by name or email"
            />
          </div>
        </div>

        {/* Campaign filter */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="campaign-filter" className="text-xs text-muted-foreground">
            Campaign
          </Label>
          <Select
            value={campaign}
            onValueChange={(v: string | null) => {
              const val = v ?? "all"
              setCampaign(val)
              applyFilters({ campaign: val })
            }}
          >
            <SelectTrigger id="campaign-filter" className="w-48">
              <SelectValue placeholder="All campaigns" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All campaigns</SelectItem>
              {filterOptions.campaigns.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Country filter */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="country-filter" className="text-xs text-muted-foreground">
            Country
          </Label>
          <Select
            value={country}
            onValueChange={(v: string | null) => {
              const val = v ?? "all"
              setCountry(val)
              applyFilters({ country: val })
            }}
          >
            <SelectTrigger id="country-filter" className="w-44">
              <SelectValue placeholder="All countries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All countries</SelectItem>
              {filterOptions.countries.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search apply + clear */}
        <div className="flex items-end gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => applyFilters()}
            disabled={isPending}
            aria-label="Apply search"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="size-4" aria-hidden="true" />
            )}
            Search
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              aria-label="Clear all filters"
            >
              <X className="size-4" aria-hidden="true" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* ── Result count ─────────────────────────────────────────────────── */}
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {total === 0
          ? "No authors found."
          : `${total} author${total !== 1 ? "s" : ""}${hasActiveFilters ? " matching filters" : ""}`}
      </p>

      {/* ── Error banner ─────────────────────────────────────────────────── */}
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

      {/* ── Delete confirmation dialog ───────────────────────────────────── */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => { if (!open) setPendingDelete(null) }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogMedia>
              <Trash2 className="size-5 text-destructive" aria-hidden="true" />
            </AlertDialogMedia>
            <AlertDialogTitle>Delete author?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="font-medium text-foreground">
                {pendingDelete?.name ?? pendingDelete?.email ?? "This author"}
              </strong>{" "}
              and{" "}
              {submissionCount === 0
                ? "all their contributions"
                : submissionCount === 1
                  ? "their 1 contribution"
                  : `all ${submissionCount} of their contributions`}{" "}
              will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleDeleteConfirmed}
            >
              {deletingId ? (
                <Loader2 data-icon="inline-start" className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 data-icon="inline-start" aria-hidden="true" />
              )}
              Delete author
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Table ─────────────────────────────────────────────────────────── */}
      {authors.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          No authors found{hasActiveFilters ? " matching your filters" : ""}.
        </Card>
      ) : (
        <Card className="overflow-hidden p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Submissions</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-12 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody aria-live="polite">
              {authors.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">
                    {a.name ?? "Anonymous"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="break-all">{a.email}</span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.country ?? <span className="text-muted-foreground/50">—</span>}
                  </TableCell>
                  <TableCell>
                    <AuthorStatusBadge status={a.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {submissionCounts[a.id] ?? 0}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(a.joinedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Actions for ${a.name ?? "anonymous"}`}
                          >
                            <MoreHorizontal className="size-4" aria-hidden="true" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          render={
                            <Link href={`/dashboard/contributions?author=${a.id}`}>
                              <FileText className="size-4" aria-hidden="true" />
                              View submissions
                            </Link>
                          }
                        />
                        <DropdownMenuSeparator />
                        {a.status === "banned" ? (
                          <DropdownMenuItem onClick={() => setStatus(a.id, "active")}>
                            <ShieldCheck className="size-4" aria-hidden="true" />
                            Reinstate author
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setStatus(a.id, "banned")}
                          >
                            <Ban className="size-4" aria-hidden="true" />
                            Ban author
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setPendingDelete(a)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                          Delete author &amp; contributions
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

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <nav
          className="flex items-center justify-between gap-2 pt-1"
          aria-label="Authors pagination"
        >
          <p className="text-sm text-muted-foreground tabular-nums">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1 || isPending}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>

            {/* Page number chips — show up to 5 around the current page */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === totalPages ||
                  Math.abs(p - currentPage) <= 2,
              )
              .reduce<Array<number | "…">>((acc, p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…")
                acc.push(p)
                return acc
              }, [])
              .map((p, idx) =>
                p === "…" ? (
                  <span
                    key={`ellipsis-${idx}`}
                    className="px-1 text-sm text-muted-foreground"
                    aria-hidden="true"
                  >
                    …
                  </span>
                ) : (
                  <Button
                    key={p}
                    variant={p === currentPage ? "default" : "outline"}
                    size="icon"
                    onClick={() => goToPage(p as number)}
                    disabled={isPending}
                    aria-label={`Page ${p}`}
                    aria-current={p === currentPage ? "page" : undefined}
                    className="size-8 text-xs"
                  >
                    {p}
                  </Button>
                ),
              )}

            <Button
              variant="outline"
              size="icon"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages || isPending}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </nav>
      )}
    </div>
  )
}
