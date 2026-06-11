import type { Metadata } from "next"
import { AdminShell } from "@/components/admin/admin-shell"

export const metadata: Metadata = {
  title: "Admin · Last2Lines",
  description: "Moderation and campaign management for Last2Lines.",
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminShell>{children}</AdminShell>
}
