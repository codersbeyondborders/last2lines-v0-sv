"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Menu, X } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/visualize", label: "Map" },
  { href: "/archives", label: "Archives" },
  { href: "/contact", label: "Contact" },
]

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="font-sans text-lg font-semibold tracking-tight">
            Last || Lines
          </span>
        </Link>

        {/* Desktop nav */}
        <nav
          aria-label="Primary"
          className="hidden items-center gap-1 text-sm font-medium text-muted-foreground sm:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                pathname === link.href && "text-foreground",
                link.label === "Archives" && "flex items-center gap-1.5",
              )}
              aria-current={pathname === link.href ? "page" : undefined}
            >
              {link.label === "Archives" && (
                <BookOpen className="size-3.5" aria-hidden="true" />
              )}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            size="sm"
            nativeButton={false}
            className="hidden sm:inline-flex"
            render={<Link href="/#campaigns">Campaigns</Link>}
          />
          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Mobile nav sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-72 p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle className="text-left font-sans text-base font-semibold tracking-tight">
              Last || Lines
            </SheetTitle>
          </SheetHeader>
          <nav
            aria-label="Mobile navigation"
            className="flex flex-col gap-1 p-4"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  pathname === link.href
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground",
                  link.label === "Archives" && "text-primary hover:text-primary",
                )}
                aria-current={pathname === link.href ? "page" : undefined}
              >
                {link.label === "Archives" && (
                  <BookOpen className="size-4 shrink-0" aria-hidden="true" />
                )}
                {link.label}
              </Link>
            ))}
            <div className="mt-3 pt-3 border-t border-border">
              <Link
                href="/#campaigns"
                onClick={() => setMobileOpen(false)}
                className="flex w-full items-center justify-center rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Campaigns
              </Link>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  )
}
