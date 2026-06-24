'use client'

import { useState } from 'react'
import {
  Server,
  Database,
  Shield,
  Zap,
  Globe,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Layers,
  Lock,
  Cpu,
  Users,
  FileText,
  GitMerge,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────
type NodeId =
  | 'browser-public'
  | 'browser-admin'
  | 'edge-middleware'
  | 'nextjs-app'
  | 'server-components'
  | 'server-actions'
  | 'ai-gateway'
  | 'supabase-auth'
  | 'aws-rds'
  | 'aws-bedrock'
  | 'vercel-blob'

interface NodeDetail {
  title: string
  description: string
  tech: string[]
  color: string
  icon: React.ReactNode
  details: string[]
}

// ──────────────────────────────────────────────
// Node definitions
// ──────────────────────────────────────────────
const NODE_INFO: Record<NodeId, NodeDetail> = {
  'browser-public': {
    title: 'Public Visitor',
    description: 'Unauthenticated browser — browses campaigns and submits couplets.',
    tech: ['React 19', 'Client Components'],
    color: 'border-emerald-500/60 bg-emerald-500/5',
    icon: <Globe className="w-4 h-4" />,
    details: [
      'No login required for submissions',
      'Client-side field validation before submit',
      'Consent checkbox required',
      'Real-time character count feedback',
    ],
  },
  'browser-admin': {
    title: 'Admin Browser',
    description: 'Authenticated admin — manages campaigns, moderates couplets, bans authors.',
    tech: ['React 19', 'Supabase Auth UI'],
    color: 'border-amber-500/60 bg-amber-500/5',
    icon: <Shield className="w-4 h-4" />,
    details: [
      'Signs in via Supabase email/password',
      'Session cookie refreshed by Edge Middleware',
      'Full dashboard access after auth',
      'Campaign CRUD, moderation, author management',
    ],
  },
  'edge-middleware': {
    title: 'Edge Middleware',
    description: 'Runs on every non-static request to refresh the admin Supabase session cookie.',
    tech: ['Next.js Middleware', 'Supabase SSR Proxy'],
    color: 'border-violet-500/60 bg-violet-500/5',
    icon: <RefreshCw className="w-4 h-4" />,
    details: [
      'Matches all non-static routes',
      'Calls lib/supabase/proxy.ts',
      'Keeps admin session alive without per-page boilerplate',
      'Static assets & images excluded via matcher',
    ],
  },
  'nextjs-app': {
    title: 'Next.js 16 App Router',
    description: 'Core application runtime hosted on Vercel Fluid Compute.',
    tech: ['Next.js 16', 'React 19', 'Fluid Compute', 'Turbopack'],
    color: 'border-sky-500/60 bg-sky-500/5',
    icon: <Layers className="w-4 h-4" />,
    details: [
      'App Router with nested layouts',
      'DB clients created per-invocation (no module globals)',
      'attachDatabasePool for correct connection lifecycle',
      'revalidatePath on every mutation',
    ],
  },
  'server-components': {
    title: 'Server Components',
    description: 'Read data directly via lib/queries.ts — query code never ships to the browser.',
    tech: ['server-only', 'lib/queries.ts', 'pg'],
    color: 'border-sky-400/60 bg-sky-400/5',
    icon: <FileText className="w-4 h-4" />,
    details: [
      'marked server-only to prevent client bundling',
      'Parameterized SQL via pg',
      'Reads campaigns, contributions, authors, stats',
      'Powers homepage, campaign pages, dashboard',
    ],
  },
  'server-actions': {
    title: 'Server Actions',
    description: 'Handle every mutation — submit couplet, moderate, CRUD campaigns, ban authors.',
    tech: ['lib/actions.ts', 'requireAdmin()', 'zod'],
    color: 'border-sky-300/60 bg-sky-300/5',
    icon: <GitMerge className="w-4 h-4" />,
    details: [
      'Server-side Zod validation on all inputs',
      'requireAdmin() guards all privileged mutations',
      'Calls AI moderation before inserting contribution',
      'revalidatePath to bust page cache after writes',
    ],
  },
  'ai-gateway': {
    title: 'Vercel AI Gateway',
    description: 'Zero-config proxy to AWS Bedrock. OIDC token authenticates downstream.',
    tech: ['Vercel AI SDK 6', 'OIDC', 'AWS Bedrock'],
    color: 'border-fuchsia-500/60 bg-fuchsia-500/5',
    icon: <Zap className="w-4 h-4" />,
    details: [
      'No API keys stored — uses OIDC identity',
      'Routes to amazon/nova-micro via Bedrock',
      'Structured JSON output via Zod schema',
      'Errors fall back to human review (never auto-approve)',
    ],
  },
  'supabase-auth': {
    title: 'Supabase Auth',
    description: 'Admin-only authentication. Cookie-based SSR sessions, no JWT in localStorage.',
    tech: ['@supabase/ssr', 'SSR Cookies', 'Email/Password'],
    color: 'border-teal-500/60 bg-teal-500/5',
    icon: <Lock className="w-4 h-4" />,
    details: [
      'Per-request SSR client (never a global)',
      'lib/supabase/server.ts & client.ts',
      'Session refreshed by edge middleware proxy',
      'Public submissions require NO auth',
    ],
  },
  'aws-rds': {
    title: 'AWS RDS PostgreSQL',
    description: 'System of record. IAM auth — no static passwords stored anywhere.',
    tech: ['PostgreSQL', '@aws-sdk/rds-signer', 'IAM Auth', 'TLS'],
    color: 'border-orange-500/60 bg-orange-500/5',
    icon: <Database className="w-4 h-4" />,
    details: [
      'campaigns, contributions, authors, moderation_settings',
      'IAM token generated per-connection by rds-signer',
      'OIDC via @vercel/functions/oidc → IAM role assumption',
      'Pool capped at 5 (serverless-safe)',
    ],
  },
  'aws-bedrock': {
    title: 'AWS Bedrock',
    description: 'AI inference for couplet moderation. Amazon Nova Micro model.',
    tech: ['Amazon Nova Micro', 'Structured Output', 'Zod'],
    color: 'border-rose-500/60 bg-rose-500/5',
    icon: <Cpu className="w-4 h-4" />,
    details: [
      'Receives couplet + campaign context + system prompt',
      'Returns { decision, confidence, reason }',
      'Supports lenient / standard / strict moderation levels',
      'Accessed through Vercel AI Gateway (no direct SDK)',
    ],
  },
  'vercel-blob': {
    title: 'Vercel Blob',
    description: 'Object storage for campaign images uploaded by admins.',
    tech: ['@vercel/blob', 'PUT upload', 'Private store'],
    color: 'border-indigo-500/60 bg-indigo-500/5',
    icon: <Server className="w-4 h-4" />,
    details: [
      'Admin-only upload via /api/upload route',
      'Returns a public CDN URL stored in campaigns table',
      'Used for campaign header images',
    ],
  },
}

// ──────────────────────────────────────────────
// Small reusable components
// ──────────────────────────────────────────────
function NodeCard({
  id,
  selected,
  onClick,
}: {
  id: NodeId
  selected: boolean
  onClick: (id: NodeId) => void
}) {
  const info = NODE_INFO[id]
  return (
    <button
      onClick={() => onClick(id)}
      aria-pressed={selected}
      className={`
        w-full text-left rounded-xl border p-3 transition-all duration-200
        hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-emerald-500 focus-visible:ring-offset-2
        focus-visible:ring-offset-background
        ${info.color}
        ${selected ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-500/10' : ''}
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-foreground/70">{info.icon}</span>
        <span className="text-sm font-semibold text-foreground leading-tight">{info.title}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{info.description}</p>
      <div className="flex flex-wrap gap-1 mt-2">
        {info.tech.slice(0, 2).map((t) => (
          <span
            key={t}
            className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono"
          >
            {t}
          </span>
        ))}
      </div>
    </button>
  )
}

function DetailPanel({ id, onClose }: { id: NodeId; onClose: () => void }) {
  const info = NODE_INFO[id]
  return (
    <div
      role="region"
      aria-label={`Details for ${info.title}`}
      className={`rounded-2xl border p-5 ${info.color} transition-all duration-300`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-background/50 text-foreground/80">{info.icon}</div>
          <div>
            <h2 className="font-bold text-foreground">{info.title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{info.description}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close detail panel"
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Technologies
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {info.tech.map((t) => (
              <span
                key={t}
                className="text-xs px-2 py-1 rounded-md bg-background/70 text-foreground border border-border font-mono"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Key Responsibilities
          </h3>
          <ul className="space-y-1.5" aria-live="polite">
            {info.details.map((d) => (
              <li key={d} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 my-2 px-2">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">{label}</span>
      <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
      <div className="h-px flex-1 bg-border" />
    </div>
  )
}

function LayerSection({
  label,
  sublabel,
  color,
  children,
}: {
  label: string
  sublabel?: string
  color: string
  children: React.ReactNode
}) {
  return (
    <section
      aria-label={label}
      className={`rounded-2xl border-2 ${color} p-4`}
    >
      <div className="flex items-baseline gap-2 mb-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-foreground/60">{label}</h2>
        {sublabel && (
          <span className="text-[10px] text-muted-foreground font-mono">{sublabel}</span>
        )}
      </div>
      {children}
    </section>
  )
}

// ──────────────────────────────────────────────
// Request Flow section
// ──────────────────────────────────────────────
type FlowStep = { label: string; nodes: NodeId[]; note?: string }

const PUBLIC_FLOW: FlowStep[] = [
  { label: '1. Visitor fills couplet form', nodes: ['browser-public'], note: 'Client-side validation first' },
  { label: '2. Edge Middleware runs', nodes: ['edge-middleware'], note: 'No session needed; passes through' },
  { label: '3. Server Action validates & moderates', nodes: ['server-actions', 'ai-gateway'], note: 'Zod re-validates; calls Bedrock via gateway' },
  { label: '4. Writes to RDS, revalidates pages', nodes: ['aws-rds'], note: 'Author upsert + contribution insert' },
]

const ADMIN_FLOW: FlowStep[] = [
  { label: '1. Admin signs in', nodes: ['browser-admin', 'supabase-auth'], note: 'SSR cookie session created' },
  { label: '2. Every request refreshes cookie', nodes: ['edge-middleware'], note: 'middleware.ts + supabase/proxy.ts' },
  { label: '3. Dashboard loads data', nodes: ['server-components', 'aws-rds'], note: 'Server Components via lib/queries.ts' },
  { label: '4. Admin takes action', nodes: ['server-actions', 'aws-rds'], note: 'requireAdmin() guard + mutation + revalidate' },
]

function FlowDiagram({ steps, title }: { steps: FlowStep[]; title: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-inset"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-foreground">{title}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="p-4 space-y-2" aria-live="polite">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground leading-snug">{step.label}</p>
                {step.note && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.note}</p>
                )}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {step.nodes.map((n) => (
                    <span
                      key={n}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono"
                    >
                      {NODE_INFO[n].title}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────
// Security notes
// ──────────────────────────────────────────────
const SECURITY_NOTES = [
  {
    icon: <Lock className="w-4 h-4 text-emerald-500" />,
    title: 'No static cloud secrets',
    desc: 'AWS RDS & Bedrock accessed via short-lived OIDC credentials — no access keys stored.',
  },
  {
    icon: <Shield className="w-4 h-4 text-emerald-500" />,
    title: 'Parameterized SQL everywhere',
    desc: 'Every query in lib/queries.ts and lib/actions.ts uses parameterized statements.',
  },
  {
    icon: <AlertTriangle className="w-4 h-4 text-emerald-500" />,
    title: 'Fail-safe AI moderation',
    desc: 'AI errors return a safe "review" fallback. Submissions are queued for humans, never lost.',
  },
  {
    icon: <Users className="w-4 h-4 text-emerald-500" />,
    title: 'requireAdmin() on all mutations',
    desc: 'Every privileged Server Action verifies Supabase session before execution.',
  },
]

// ──────────────────────────────────────────────
// Main page
// ──────────────────────────────────────────────
export default function ArchitecturePage() {
  const [selected, setSelected] = useState<NodeId | null>(null)

  function handleSelect(id: NodeId) {
    setSelected((prev) => (prev === id ? null : id))
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* ── Header ── */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-bold text-lg text-balance leading-tight">
              Last 2 Lines — Architecture
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click any node to inspect it
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-mono shrink-0">
            Next.js 16 · AWS · Supabase
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Detail panel ── */}
        {selected && (
          <DetailPanel id={selected} onClose={() => setSelected(null)} />
        )}

        {/* ── Diagram ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Column 1 – Clients */}
          <LayerSection label="Clients" color="border-border/50">
            <div className="space-y-2">
              <NodeCard id="browser-public" selected={selected === 'browser-public'} onClick={handleSelect} />
              <NodeCard id="browser-admin" selected={selected === 'browser-admin'} onClick={handleSelect} />
            </div>
          </LayerSection>

          {/* Column 2 – Vercel */}
          <LayerSection label="Vercel" sublabel="compute + hosting" color="border-sky-500/30">
            <div className="space-y-2">
              <NodeCard id="edge-middleware" selected={selected === 'edge-middleware'} onClick={handleSelect} />
              <FlowArrow label="request passes through" />
              <NodeCard id="nextjs-app" selected={selected === 'nextjs-app'} onClick={handleSelect} />
              <div className="grid grid-cols-2 gap-2">
                <NodeCard id="server-components" selected={selected === 'server-components'} onClick={handleSelect} />
                <NodeCard id="server-actions" selected={selected === 'server-actions'} onClick={handleSelect} />
              </div>
              <FlowArrow label="AI moderation call" />
              <NodeCard id="ai-gateway" selected={selected === 'ai-gateway'} onClick={handleSelect} />
              <NodeCard id="vercel-blob" selected={selected === 'vercel-blob'} onClick={handleSelect} />
            </div>
          </LayerSection>

          {/* Column 3 – External Services */}
          <div className="space-y-4">
            <LayerSection label="AWS" sublabel="IAM / OIDC auth" color="border-orange-500/30">
              <div className="space-y-2">
                <NodeCard id="aws-rds" selected={selected === 'aws-rds'} onClick={handleSelect} />
                <NodeCard id="aws-bedrock" selected={selected === 'aws-bedrock'} onClick={handleSelect} />
              </div>
            </LayerSection>
            <LayerSection label="Supabase" sublabel="admin auth only" color="border-teal-500/30">
              <NodeCard id="supabase-auth" selected={selected === 'supabase-auth'} onClick={handleSelect} />
            </LayerSection>
          </div>
        </div>

        {/* ── Data model ── */}
        <section aria-labelledby="data-model-heading">
          <h2
            id="data-model-heading"
            className="text-xs font-bold uppercase tracking-widest text-foreground/50 mb-3"
          >
            Data Model (RDS PostgreSQL)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { table: 'campaigns', cols: ['id', 'slug', 'title', 'status', 'ai_moderation_enabled'] },
              { table: 'contributions', cols: ['id', 'campaign_id', 'line_one', 'line_two', 'status', 'sequence_number'] },
              { table: 'authors', cols: ['id', 'email', 'active', 'banned'] },
              { table: 'moderation_settings', cols: ['campaign_id', 'level', 'custom_prompt'] },
            ].map(({ table, cols }) => (
              <div
                key={table}
                className="rounded-xl border border-border bg-muted/20 p-3"
              >
                <p className="text-xs font-bold text-foreground font-mono mb-2">{table}</p>
                <ul className="space-y-1">
                  {cols.map((c) => (
                    <li key={c} className="text-[10px] text-muted-foreground font-mono leading-relaxed">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Request Flows ── */}
        <section aria-labelledby="flows-heading">
          <h2
            id="flows-heading"
            className="text-xs font-bold uppercase tracking-widest text-foreground/50 mb-3"
          >
            Request Flows
          </h2>
          <div className="space-y-3">
            <FlowDiagram title="Public Submission Flow" steps={PUBLIC_FLOW} />
            <FlowDiagram title="Admin Moderation Flow" steps={ADMIN_FLOW} />
          </div>
        </section>

        {/* ── Security ── */}
        <section aria-labelledby="security-heading">
          <h2
            id="security-heading"
            className="text-xs font-bold uppercase tracking-widest text-foreground/50 mb-3"
          >
            Security Principles
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SECURITY_NOTES.map((n) => (
              <div
                key={n.title}
                className="flex items-start gap-3 rounded-xl border border-border bg-muted/10 p-4"
              >
                <div className="shrink-0 mt-0.5">{n.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-snug">{n.title}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{n.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Legend ── */}
        <footer className="border-t border-border pt-4">
          <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border-2 border-sky-500/40 bg-sky-500/10 inline-block" />
              Vercel Layer
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border-2 border-orange-500/40 bg-orange-500/10 inline-block" />
              AWS Layer
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border-2 border-teal-500/40 bg-teal-500/10 inline-block" />
              Supabase Auth
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm border-2 border-emerald-500/50 bg-emerald-500/10 inline-block" />
              Selected Node
            </span>
          </div>
        </footer>
      </div>
    </main>
  )
}
