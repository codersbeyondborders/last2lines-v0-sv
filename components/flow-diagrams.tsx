"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type NodeKind =
  | "start"
  | "end"
  | "action"
  | "decision"
  | "system"
  | "error"
  | "email"

interface FlowNode {
  id: string
  label: string
  sublabel?: string
  kind: NodeKind
}

interface FlowEdge {
  from: string
  to: string
  label?: string
  variant?: "default" | "error" | "success" | "muted"
}

interface FlowDiagram {
  id: string
  title: string
  description: string
  nodes: FlowNode[]
  edges: FlowEdge[]
  /** Ordered rows of node IDs to position the diagram */
  layout: string[][]
}

// ─── Diagram Definitions ──────────────────────────────────────────────────────

const DIAGRAMS: FlowDiagram[] = [
  // ── 1. Public Contribution (Standard) ──────────────────────────────────────
  {
    id: "submission-standard",
    title: "UC-03 — Submit a Couplet (Standard)",
    description:
      "Visitor submits two lines to an active campaign. AI moderation resolves the outcome immediately.",
    layout: [
      ["visitor"],
      ["fill-form"],
      ["client-validate"],
      ["submit-action"],
      ["check-campaign"],
      ["check-banned"],
      ["ai-branch"],
      ["publish", "curate", "manual"],
      ["approved", "approved-curated", "pending"],
      ["success"],
    ],
    nodes: [
      { id: "visitor", label: "Visitor", sublabel: "/campaign/[slug]", kind: "start" },
      { id: "fill-form", label: "Fill Submission Form", sublabel: "Name · Email · Line 1 · Line 2 · Consent", kind: "action" },
      { id: "client-validate", label: "Client-side Validation", sublabel: "Red borders · char counters · disabled submit", kind: "system" },
      { id: "submit-action", label: "submitContribution()", sublabel: "Server Action", kind: "system" },
      { id: "check-campaign", label: "Campaign Open?", sublabel: "status=active & within date window", kind: "decision" },
      { id: "check-banned", label: "Author Banned?", sublabel: "Upsert author by email", kind: "decision" },
      { id: "ai-branch", label: "AI Moderation Enabled?", sublabel: "campaign.ai_moderation", kind: "decision" },
      { id: "publish", label: "Verdict: publish", sublabel: "Original lines pass", kind: "system" },
      { id: "curate", label: "Verdict: curate", sublabel: "AI rewrites lines", kind: "system" },
      { id: "manual", label: "Verdict: manual", sublabel: "Queued for human review", kind: "system" },
      { id: "approved", label: "status = approved", sublabel: "sequence_number assigned", kind: "action" },
      { id: "approved-curated", label: "status = approved", sublabel: "curated lines stored", kind: "action" },
      { id: "pending", label: "status = pending", sublabel: "Added to moderation queue", kind: "action" },
      { id: "success", label: "Success Screen", sublabel: "Your lines are on their way", kind: "end" },
      { id: "err-closed", label: "Error: Campaign not open", kind: "error" },
      { id: "err-banned", label: "Error: Author is banned", kind: "error" },
    ],
    edges: [
      { from: "visitor", to: "fill-form" },
      { from: "fill-form", to: "client-validate" },
      { from: "client-validate", to: "submit-action", label: "valid" },
      { from: "submit-action", to: "check-campaign" },
      { from: "check-campaign", to: "check-banned", label: "Yes" },
      { from: "check-campaign", to: "err-closed", label: "No", variant: "error" },
      { from: "check-banned", to: "ai-branch", label: "No" },
      { from: "check-banned", to: "err-banned", label: "Yes", variant: "error" },
      { from: "ai-branch", to: "publish", label: "publish" },
      { from: "ai-branch", to: "curate", label: "curate" },
      { from: "ai-branch", to: "manual", label: "manual / off" },
      { from: "publish", to: "approved" },
      { from: "curate", to: "approved-curated" },
      { from: "manual", to: "pending" },
      { from: "approved", to: "success" },
      { from: "approved-curated", to: "success" },
      { from: "pending", to: "success" },
    ],
  },

  // ── 2. OTP Email Verification ───────────────────────────────────────────────
  {
    id: "otp-verification",
    title: "UC-04 — Email OTP Verification",
    description:
      "When a campaign requires email verification, contributors prove ownership of their address with a 6-digit code before the couplet is submitted.",
    layout: [
      ["start-otp"],
      ["fill-form-otp"],
      ["post-send-otp"],
      ["invalidate-old"],
      ["gen-code"],
      ["send-email"],
      ["enter-code"],
      ["post-verify-otp"],
      ["check-otp"],
      ["submit-with-flag"],
      ["end-otp"],
    ],
    nodes: [
      { id: "start-otp", label: "Visitor", sublabel: "campaign.require_email_verification = true", kind: "start" },
      { id: "fill-form-otp", label: "Fill Submission Form", kind: "action" },
      { id: "post-send-otp", label: "POST /api/send-otp", sublabel: "{ email, campaignId, campaignTitle }", kind: "system" },
      { id: "invalidate-old", label: "Invalidate Existing OTPs", sublabel: "Mark prior unused OTPs as used", kind: "system" },
      { id: "gen-code", label: "Generate 6-digit Code", sublabel: "SHA-256 hash stored · 15 min expiry", kind: "system" },
      { id: "send-email", label: "Send Email via Resend", sublabel: "Code delivered to inbox", kind: "email" },
      { id: "enter-code", label: "Contributor Enters Code", kind: "action" },
      { id: "post-verify-otp", label: "POST /api/verify-otp", sublabel: "{ email, campaignId, code }", kind: "system" },
      { id: "check-otp", label: "Code Valid?", sublabel: "Hash match · not used · not expired", kind: "decision" },
      { id: "submit-with-flag", label: "submitContribution()", sublabel: "emailVerified = true", kind: "system" },
      { id: "end-otp", label: "Success Screen", kind: "end" },
      { id: "err-invalid", label: "Error: Invalid / Expired / Used", kind: "error" },
    ],
    edges: [
      { from: "start-otp", to: "fill-form-otp" },
      { from: "fill-form-otp", to: "post-send-otp", label: "passes validation" },
      { from: "post-send-otp", to: "invalidate-old" },
      { from: "invalidate-old", to: "gen-code" },
      { from: "gen-code", to: "send-email" },
      { from: "send-email", to: "enter-code" },
      { from: "enter-code", to: "post-verify-otp" },
      { from: "post-verify-otp", to: "check-otp" },
      { from: "check-otp", to: "submit-with-flag", label: "Valid", variant: "success" },
      { from: "check-otp", to: "err-invalid", label: "Invalid", variant: "error" },
      { from: "submit-with-flag", to: "end-otp" },
    ],
  },

  // ── 3. AI Moderation Pipeline ───────────────────────────────────────────────
  {
    id: "ai-moderation",
    title: "SF-01 — AI Moderation Pipeline",
    description:
      "Invoked inside submitContribution when ai_moderation is enabled. Uses AWS Bedrock (Amazon Nova Micro) via the Vercel AI Gateway.",
    layout: [
      ["trigger"],
      ["fetch-context"],
      ["build-prompt"],
      ["call-bedrock"],
      ["parse-response"],
      ["verdict"],
      ["v-publish", "v-curate", "v-manual", "v-error"],
      ["r-publish", "r-curate", "r-manual", "r-fallback"],
    ],
    nodes: [
      { id: "trigger", label: "submitContribution()", sublabel: "ai_moderation = true", kind: "start" },
      { id: "fetch-context", label: "Fetch Last 2 Approved Couplets", sublabel: "Poem context for the model", kind: "system" },
      { id: "build-prompt", label: "Build System + User Prompt", sublabel: "Editorial role · decision rules · level guidance", kind: "system" },
      { id: "call-bedrock", label: "generateText() → AWS Bedrock", sublabel: "Amazon Nova Micro via AI Gateway · Zod schema", kind: "system" },
      { id: "parse-response", label: "Parse Structured Output", sublabel: "{ decision, lines?, reason }", kind: "system" },
      { id: "verdict", label: "Verdict?", kind: "decision" },
      { id: "v-publish", label: "publish", kind: "action" },
      { id: "v-curate", label: "curate", kind: "action" },
      { id: "v-manual", label: "manual", kind: "action" },
      { id: "v-error", label: "Error / Timeout", kind: "error" },
      { id: "r-publish", label: "Original lines · status = approved", kind: "end" },
      { id: "r-curate", label: "AI lines · status = approved", kind: "end" },
      { id: "r-manual", label: "Original lines · status = pending", kind: "end" },
      { id: "r-fallback", label: "Fallback: status = pending", sublabel: "Never auto-rejects", kind: "end" },
    ],
    edges: [
      { from: "trigger", to: "fetch-context" },
      { from: "fetch-context", to: "build-prompt" },
      { from: "build-prompt", to: "call-bedrock" },
      { from: "call-bedrock", to: "parse-response", label: "200 OK" },
      { from: "call-bedrock", to: "v-error", label: "fail / timeout", variant: "error" },
      { from: "parse-response", to: "verdict" },
      { from: "verdict", to: "v-publish", label: "publish" },
      { from: "verdict", to: "v-curate", label: "curate" },
      { from: "verdict", to: "v-manual", label: "manual" },
      { from: "v-publish", to: "r-publish" },
      { from: "v-curate", to: "r-curate" },
      { from: "v-manual", to: "r-manual" },
      { from: "v-error", to: "r-fallback", variant: "muted" },
    ],
  },

  // ── 4. Admin Moderation Queue ───────────────────────────────────────────────
  {
    id: "admin-moderation",
    title: "UC-16 — Admin Moderation Queue",
    description:
      "Admin reviews pending contributions and approves, rejects, or re-queues them. Approved contributions optionally trigger a publish-confirmation email.",
    layout: [
      ["admin-login"],
      ["view-queue"],
      ["select-contribution"],
      ["admin-decision"],
      ["approve", "reject", "requeue"],
      ["assign-seq", "set-rejected", "set-pending"],
      ["email-check"],
      ["send-email-confirm"],
      ["revalidate"],
    ],
    nodes: [
      { id: "admin-login", label: "Admin", sublabel: "Authenticated via Supabase Auth", kind: "start" },
      { id: "view-queue", label: "View Contributions Queue", sublabel: "/dashboard/contributions", kind: "action" },
      { id: "select-contribution", label: "Select Contribution", sublabel: "Filter by status / campaign", kind: "action" },
      { id: "admin-decision", label: "Action?", kind: "decision" },
      { id: "approve", label: "Approve", kind: "action" },
      { id: "reject", label: "Reject", kind: "action" },
      { id: "requeue", label: "Re-queue", kind: "action" },
      { id: "assign-seq", label: "Assign sequence_number", sublabel: "MAX(seq)+1 for campaign", kind: "system" },
      { id: "set-rejected", label: "status = rejected", sublabel: "sequence_number = 0", kind: "system" },
      { id: "set-pending", label: "status = pending", sublabel: "sequence_number = 0", kind: "system" },
      { id: "email-check", label: "auto_email_on_publish?", kind: "decision" },
      { id: "send-email-confirm", label: "Send Publish Email", sublabel: "Resend → author inbox · record publish_email_sent_at", kind: "email" },
      { id: "revalidate", label: "revalidatePath()", sublabel: "Dashboard · campaign · contributions", kind: "end" },
    ],
    edges: [
      { from: "admin-login", to: "view-queue" },
      { from: "view-queue", to: "select-contribution" },
      { from: "select-contribution", to: "admin-decision" },
      { from: "admin-decision", to: "approve", label: "Approve" },
      { from: "admin-decision", to: "reject", label: "Reject" },
      { from: "admin-decision", to: "requeue", label: "Re-queue" },
      { from: "approve", to: "assign-seq" },
      { from: "reject", to: "set-rejected" },
      { from: "requeue", to: "set-pending" },
      { from: "assign-seq", to: "email-check" },
      { from: "email-check", to: "send-email-confirm", label: "Yes", variant: "success" },
      { from: "email-check", to: "revalidate", label: "No", variant: "muted" },
      { from: "send-email-confirm", to: "revalidate" },
      { from: "set-rejected", to: "revalidate" },
      { from: "set-pending", to: "revalidate" },
    ],
  },

  // ── 5. Admin Auth & Session ─────────────────────────────────────────────────
  {
    id: "admin-auth",
    title: "UC-10/11 — Admin Auth & Session Lifecycle",
    description:
      "Edge Middleware refreshes the Supabase session on every protected request. requireAdmin() guards all Server Actions.",
    layout: [
      ["request"],
      ["middleware"],
      ["is-protected"],
      ["refresh-session"],
      ["session-valid"],
      ["serve-page"],
      ["redirect-login"],
      ["login-form"],
      ["sign-in-pw"],
      ["auth-check"],
      ["set-cookie"],
      ["dashboard-home"],
    ],
    nodes: [
      { id: "request", label: "Incoming Request", sublabel: "Any URL", kind: "start" },
      { id: "middleware", label: "Edge Middleware", sublabel: "middleware.ts · updateSession()", kind: "system" },
      { id: "is-protected", label: "Protected Route?", sublabel: "/dashboard/* /admin/* /auth/* /api/*", kind: "decision" },
      { id: "refresh-session", label: "Refresh Supabase Cookie", sublabel: "supabase.auth.getUser()", kind: "system" },
      { id: "session-valid", label: "Session Valid?", kind: "decision" },
      { id: "serve-page", label: "Serve Page / Action", kind: "end" },
      { id: "redirect-login", label: "Redirect → /auth/login?next=", kind: "action" },
      { id: "login-form", label: "Admin Enters Email + Password", kind: "action" },
      { id: "sign-in-pw", label: "signInWithPassword()", sublabel: "Supabase Auth", kind: "system" },
      { id: "auth-check", label: "Credentials Valid?", kind: "decision" },
      { id: "set-cookie", label: "Write Session Cookie", sublabel: "Redirect → ?next= or /dashboard", kind: "system" },
      { id: "dashboard-home", label: "Dashboard", kind: "end" },
      { id: "err-creds", label: "Inline Error: Invalid credentials", kind: "error" },
      { id: "bypass", label: "Bypass — Public Route", sublabel: "Static assets, /, /campaign/[slug] etc.", kind: "end" },
    ],
    edges: [
      { from: "request", to: "middleware" },
      { from: "middleware", to: "is-protected" },
      { from: "is-protected", to: "refresh-session", label: "Yes" },
      { from: "is-protected", to: "bypass", label: "No", variant: "muted" },
      { from: "refresh-session", to: "session-valid" },
      { from: "session-valid", to: "serve-page", label: "Valid", variant: "success" },
      { from: "session-valid", to: "redirect-login", label: "Invalid / expired", variant: "error" },
      { from: "redirect-login", to: "login-form" },
      { from: "login-form", to: "sign-in-pw" },
      { from: "sign-in-pw", to: "auth-check" },
      { from: "auth-check", to: "set-cookie", label: "Valid", variant: "success" },
      { from: "auth-check", to: "err-creds", label: "Invalid", variant: "error" },
      { from: "set-cookie", to: "dashboard-home" },
    ],
  },

  // ── 6. Campaign Lifecycle ───────────────────────────────────────────────────
  {
    id: "campaign-lifecycle",
    title: "UC-13/14/15 — Campaign Lifecycle",
    description:
      "Full lifecycle from campaign creation through active contributions to completion and archiving.",
    layout: [
      ["admin-start"],
      ["create-campaign"],
      ["insert-db"],
      ["status-draft"],
      ["change-status"],
      ["status-active"],
      ["contributions-open"],
      ["ai-moderate"],
      ["poem-grows"],
      ["status-completed"],
      ["poem-final"],
      ["status-archived"],
    ],
    nodes: [
      { id: "admin-start", label: "Admin", sublabel: "Authenticated", kind: "start" },
      { id: "create-campaign", label: "Create Campaign Form", sublabel: "Title · dates · AI settings · seed couplets", kind: "action" },
      { id: "insert-db", label: "createCampaign()", sublabel: "Insert campaign + seed couplets · generate slug", kind: "system" },
      { id: "status-draft", label: "status = draft", sublabel: "Not visible in public directory", kind: "action" },
      { id: "change-status", label: "Admin Updates Status", sublabel: "updateCampaign()", kind: "action" },
      { id: "status-active", label: "status = active", sublabel: "Visible · submission form enabled", kind: "action" },
      { id: "contributions-open", label: "Public Contributions Open", sublabel: "within start_date – close_date", kind: "action" },
      { id: "ai-moderate", label: "AI Moderation Pipeline", sublabel: "publish · curate · manual", kind: "system" },
      { id: "poem-grows", label: "Living Poem Grows", sublabel: "Approved couplets rendered in sequence", kind: "action" },
      { id: "status-completed", label: "status = completed", sublabel: "close_date passed or manual close", kind: "action" },
      { id: "poem-final", label: "Final Poem Readable", sublabel: "Submission form hidden", kind: "action" },
      { id: "status-archived", label: "status = archived", sublabel: "Hidden from directory", kind: "end" },
      { id: "status-paused", label: "status = paused", sublabel: "Submissions temporarily closed", kind: "action" },
    ],
    edges: [
      { from: "admin-start", to: "create-campaign" },
      { from: "create-campaign", to: "insert-db" },
      { from: "insert-db", to: "status-draft" },
      { from: "status-draft", to: "change-status" },
      { from: "change-status", to: "status-active", label: "→ active" },
      { from: "change-status", to: "status-paused", label: "→ paused", variant: "muted" },
      { from: "status-paused", to: "change-status", label: "→ active", variant: "muted" },
      { from: "status-active", to: "contributions-open" },
      { from: "contributions-open", to: "ai-moderate" },
      { from: "ai-moderate", to: "poem-grows" },
      { from: "poem-grows", to: "status-completed", label: "Campaign closes" },
      { from: "status-completed", to: "poem-final" },
      { from: "poem-final", to: "status-archived", label: "Admin archives", variant: "muted" },
    ],
  },
]

// ─── Node rendering helpers ───────────────────────────────────────────────────

const nodeStyles: Record<NodeKind, string> = {
  start:
    "bg-primary text-primary-foreground font-semibold rounded-full px-5 py-2.5 shadow-md",
  end: "bg-foreground text-background font-semibold rounded-full px-5 py-2.5 shadow-md",
  action:
    "bg-card text-card-foreground border border-border rounded-lg px-4 py-2.5 shadow-sm",
  decision:
    "bg-accent text-accent-foreground border border-primary/30 rounded-lg px-4 py-2.5 shadow-sm font-medium",
  system:
    "bg-muted text-foreground border border-border rounded-lg px-4 py-2.5 shadow-sm font-mono text-xs",
  error:
    "bg-destructive/10 text-destructive border border-destructive/30 rounded-lg px-4 py-2.5 shadow-sm",
  email:
    "bg-primary/10 text-primary border border-primary/30 rounded-lg px-4 py-2.5 shadow-sm",
}

const edgeColors: Record<NonNullable<FlowEdge["variant"]>, string> = {
  default: "text-muted-foreground",
  error: "text-destructive",
  success: "text-primary",
  muted: "text-muted-foreground/50",
}

const connectorColors: Record<NonNullable<FlowEdge["variant"]>, string> = {
  default: "border-muted-foreground/40",
  error: "border-destructive/60",
  success: "border-primary/60",
  muted: "border-muted-foreground/20",
}

const kindLabels: Record<NodeKind, string> = {
  start: "Actor",
  end: "Terminal",
  action: "Action",
  decision: "Decision",
  system: "System",
  error: "Error",
  email: "Email",
}

const kindDotColors: Record<NodeKind, string> = {
  start: "bg-primary",
  end: "bg-foreground",
  action: "bg-border",
  decision: "bg-accent-foreground",
  system: "bg-muted-foreground",
  error: "bg-destructive",
  email: "bg-primary/60",
}

// ─── Single node ──────────────────────────────────────────────────────────────

function FlowNodeBox({ node }: { node: FlowNode }) {
  return (
    <div className={cn("inline-flex flex-col items-center text-center max-w-[160px]", nodeStyles[node.kind])}>
      <span className="text-sm leading-snug text-pretty">{node.label}</span>
      {node.sublabel && (
        <span className="text-[10px] mt-0.5 opacity-70 leading-snug text-pretty">
          {node.sublabel}
        </span>
      )}
    </div>
  )
}

// ─── Arrow connector ──────────────────────────────────────────────────────────

function Arrow({
  label,
  variant = "default",
}: {
  label?: string
  variant?: FlowEdge["variant"]
}) {
  const v = variant ?? "default"
  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      <div className={cn("w-px h-5 border-l-2 border-dashed", connectorColors[v])} />
      {label && (
        <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted", edgeColors[v])}>
          {label}
        </span>
      )}
      <div className={cn("w-px h-3 border-l-2", connectorColors[v])} />
      <svg width="12" height="8" viewBox="0 0 12 8" className="shrink-0">
        <path
          d="M6 8 L0 0 L12 0 Z"
          className={cn(
            v === "error" ? "fill-destructive/60" :
            v === "success" ? "fill-primary/60" :
            v === "muted" ? "fill-muted-foreground/20" :
            "fill-muted-foreground/40"
          )}
        />
      </svg>
    </div>
  )
}

// ─── Diagram renderer ─────────────────────────────────────────────────────────

function DiagramView({ diagram }: { diagram: FlowDiagram }) {
  const nodeMap = Object.fromEntries(diagram.nodes.map((n) => [n.id, n]))
  const edgeMap: Record<string, FlowEdge> = {}
  for (const edge of diagram.edges) {
    edgeMap[`${edge.from}→${edge.to}`] = edge
  }

  // Build a map of edges between consecutive rows
  const rowEdges: Array<FlowEdge[]> = []
  for (let r = 0; r < diagram.layout.length - 1; r++) {
    const currentRow = diagram.layout[r]
    const nextRow = diagram.layout[r + 1]
    const found: FlowEdge[] = []
    for (const fromId of currentRow) {
      for (const toId of nextRow) {
        const key = `${fromId}→${toId}`
        if (edgeMap[key]) found.push(edgeMap[key])
      }
    }
    rowEdges.push(found)
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex flex-col items-center gap-0 min-w-[320px]">
        {diagram.layout.map((row, rowIdx) => {
          const nextEdgesForRow = rowEdges[rowIdx] ?? []

          return (
            <div key={rowIdx}>
              {/* Node row */}
              <div className="flex items-stretch justify-center gap-4 flex-wrap">
                {row.map((nodeId) => {
                  const node = nodeMap[nodeId]
                  if (!node) return null
                  return (
                    <div key={nodeId} className="flex flex-col items-center">
                      <FlowNodeBox node={node} />
                    </div>
                  )
                })}
              </div>

              {/* Connector row */}
              {rowIdx < diagram.layout.length - 1 && (
                <div className="flex items-start justify-center gap-4 flex-wrap">
                  {row.map((fromId) => {
                    const outgoing = nextEdgesForRow.filter((e) => e.from === fromId)
                    if (outgoing.length === 0) return null
                    return (
                      <div key={fromId} className="flex flex-col items-center">
                        {outgoing.map((edge, i) => (
                          <Arrow key={i} label={edge.label} variant={edge.variant} />
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  const items: NodeKind[] = ["start", "end", "action", "decision", "system", "email", "error"]
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((kind) => (
        <div key={kind} className="flex items-center gap-1.5">
          <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", kindDotColors[kind])} />
          <span className="text-xs text-muted-foreground">{kindLabels[kind]}</span>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <span className="w-6 border-t-2 border-dashed border-muted-foreground/40" />
        <span className="text-xs text-muted-foreground">Flow</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-6 border-t-2 border-dashed border-destructive/60" />
        <span className="text-xs text-muted-foreground">Error path</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="w-6 border-t-2 border-dashed border-primary/60" />
        <span className="text-xs text-muted-foreground">Success path</span>
      </div>
    </div>
  )
}

// ─── Tab nav ──────────────────────────────────────────────────────────────────

export function FlowDiagrams() {
  const [active, setActive] = useState(DIAGRAMS[0].id)
  const current = DIAGRAMS.find((d) => d.id === active) ?? DIAGRAMS[0]

  return (
    <div className="flex flex-col gap-8">
      {/* Tab navigation */}
      <nav
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Flow diagram selector"
      >
        {DIAGRAMS.map((d) => (
          <button
            key={d.id}
            role="tab"
            aria-selected={active === d.id}
            aria-controls={`panel-${d.id}`}
            onClick={() => setActive(d.id)}
            className={cn(
              "px-3 py-1.5 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active === d.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            {d.title.split(" — ")[0]}
          </button>
        ))}
      </nav>

      {/* Active diagram panel */}
      <section
        id={`panel-${current.id}`}
        role="tabpanel"
        aria-label={current.title}
        className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col gap-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-1">
          <h2 className="font-serif text-xl font-semibold text-foreground">
            {current.title}
          </h2>
          <p className="text-sm text-muted-foreground text-pretty">
            {current.description}
          </p>
        </div>

        {/* Legend */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <Legend />
        </div>

        {/* Diagram */}
        <div className="py-4">
          <DiagramView diagram={current} />
        </div>
      </section>

      {/* All diagrams overview strip */}
      <section aria-label="All flows overview">
        <h2 className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
          All Flows
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DIAGRAMS.map((d) => (
            <button
              key={d.id}
              onClick={() => {
                setActive(d.id)
                window.scrollTo({ top: 0, behavior: "smooth" })
              }}
              className={cn(
                "text-left p-4 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active === d.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:bg-accent/50"
              )}
            >
              <p className="text-xs font-mono text-muted-foreground mb-1">
                {d.title.split(" — ")[0]}
              </p>
              <p className="text-sm font-medium text-foreground leading-snug text-balance">
                {d.title.split(" — ")[1]}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 text-pretty">
                {d.description}
              </p>
              <div className="mt-3 flex gap-1.5 flex-wrap">
                {d.nodes
                  .map((n) => n.kind)
                  .filter((k, i, arr) => arr.indexOf(k) === i)
                  .map((kind) => (
                    <span
                      key={kind}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono"
                    >
                      {kindLabels[kind]}
                    </span>
                  ))}
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
