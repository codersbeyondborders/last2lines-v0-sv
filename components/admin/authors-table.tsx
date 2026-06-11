"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Ban,
  ShieldCheck,
  FileText,
  MoreHorizontal,
  AlertCircle,
} from "lucide-react"
import {
  MOCK_AUTHORS,
  MOCK_CONTRIBUTIONS,
  type Author,
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
import { AuthorStatusBadge } from "@/components/admin/status-badges"

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

const SUBMISSION_COUNT = MOCK_CONTRIBUTIONS.reduce<Record<string, number>>(
  (acc, c) => {
    acc[c.authorId] = (acc[c.authorId] ?? 0) + 1
    return acc
  },
  {},
)

export function AuthorsTable() {
  const [authors, setAuthors] = useState<Author[]>(() => [...MOCK_AUTHORS])
  const [error, setError] = useState<string | null>(null)

  function setStatus(id: string, status: Author["status"]) {
    setError(null)
    setAuthors((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    )
  }

  if (authors.length === 0) {
    return (
      <Card className="p-10 text-center text-muted-foreground">
        No authors have contributed yet.
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-4">
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

      <Card className="overflow-hidden p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Author</TableHead>
              <TableHead>Email</TableHead>
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
                <TableCell>
                  <AuthorStatusBadge status={a.status} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {SUBMISSION_COUNT[a.id] ?? 0}
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
                          aria-label={`Actions for ${a.name}`}
                        >
                          <MoreHorizontal
                            className="size-4"
                            aria-hidden="true"
                          />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        render={
                          <Link
                            href={`/dashboard/contributions?author=${a.id}`}
                          >
                            <FileText className="size-4" aria-hidden="true" />
                            View submissions
                          </Link>
                        }
                      />
                      <DropdownMenuSeparator />
                      {a.status === "banned" ? (
                        <DropdownMenuItem
                          onClick={() => setStatus(a.id, "active")}
                        >
                          <ShieldCheck
                            className="size-4"
                            aria-hidden="true"
                          />
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}
