"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ExternalLink, LogOut, Menu, Settings, X } from "lucide-react"
import { AdminSidebarNav } from "./admin-sidebar-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { signOut } from "@/lib/actions"

function nameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "admin"
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((p) => p[0]!.toUpperCase() + p.slice(1))
    .join(" ")
}

export function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode
  email: string
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [adminPanelOpen, setAdminPanelOpen] = useState(false)
  const router = useRouter()
  const admin = { name: nameFromEmail(email), email }

  async function handleSignOut() {
    setAdminPanelOpen(false)
    await signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-sidebar lg:block">
        <AdminSidebarNav />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-40 bg-foreground/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-border bg-sidebar">
            <div className="flex justify-end p-2">
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close navigation"
                onClick={() => setMobileOpen(false)}
              >
                <X className="size-5" aria-hidden="true" />
              </Button>
            </div>
            <AdminSidebarNav onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="size-5" aria-hidden="true" />
            </Button>
            <span className="font-medium text-muted-foreground">Admin</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              className="hidden sm:inline-flex"
              render={
                <Link href="/" target="_blank">
                  <ExternalLink className="size-4" aria-hidden="true" />
                  View live app
                </Link>
              }
            />
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setAdminPanelOpen(true)}
              className={cn(
                "flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-3 pl-1 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
              aria-label="Open admin panel"
            >
              <span
                aria-hidden="true"
                className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
              >
                {admin.name
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <span className="hidden max-w-32 truncate font-medium sm:inline">
                {admin.name}
              </span>
            </button>

            {/* Admin slide-over panel */}
            <Sheet open={adminPanelOpen} onOpenChange={setAdminPanelOpen}>
              <SheetContent side="right" className="w-80 sm:max-w-80 flex flex-col p-0">
                <SheetHeader className="p-6 pb-4">
                  <SheetTitle className="sr-only">Admin panel</SheetTitle>
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
                    >
                      {admin.name
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {admin.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {admin.email}
                      </p>
                    </div>
                  </div>
                </SheetHeader>

                <Separator />

                <nav className="flex flex-col gap-1 p-4" aria-label="Admin panel navigation">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setAdminPanelOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Settings className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    Settings
                  </Link>
                  <Link
                    href="/"
                    target="_blank"
                    onClick={() => setAdminPanelOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ExternalLink className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    View live app
                  </Link>
                </nav>

                <SheetFooter className="mt-auto p-4 pt-0">
                  <Separator className="mb-4" />
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <LogOut className="size-4 shrink-0" aria-hidden="true" />
                    Log out
                  </button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
