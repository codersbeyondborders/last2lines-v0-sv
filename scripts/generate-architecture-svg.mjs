import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = resolve(__dirname, '../public/architecture-diagram.svg')

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  bg:            '#0b0f1a',
  surface:       '#141928',
  border:        '#232b3e',
  layerClient:   '#111d14',
  layerVercel:   '#0a1422',
  layerAWS:      '#1a1005',
  layerSupabase: '#071a18',
  emerald:       '#22c55e',
  sky:           '#38bdf8',
  amber:         '#f59e0b',
  violet:        '#a78bfa',
  teal:          '#2dd4bf',
  orange:        '#f97316',
  rose:          '#fb7185',
  fuchsia:       '#e879f9',
  indigo:        '#818cf8',
  textPrimary:   '#f1f5f9',
  textSec:       '#94a3b8',
  textMuted:     '#4a5568',
}

// ─── Canvas ──────────────────────────────────────────────────────────────────
const W   = 1440
const H   = 860
const PAD = 36
const GAP = 18

// Three equal columns
const COL_W = Math.floor((W - PAD * 2 - GAP * 2) / 3)   // 448
const NW    = COL_W - 24    // node width
const NH    = 60             // node height
const NR    = 10             // node border-radius

const COL1X = PAD
const COL2X = PAD + COL_W + GAP
const COL3X = PAD + (COL_W + GAP) * 2

// ── Row Y positions (shared grid) ────────────────────────────────────────────
// Title area: 0–62
// Diagram area: 70–800  Legend: 810–848
const TITLE_Y  = 38
const SUB_Y    = 56

// Layer header height (label + padding above first node)
const LH       = 42

// Six evenly-spaced row slots in the diagram area
const DIAG_TOP = 72
const DIAG_BOT = 798
const USABLE   = DIAG_BOT - DIAG_TOP            // 726
const ROWS     = 6
const ROW_GAP  = Math.floor((USABLE - ROWS * NH) / (ROWS - 1))  // gap between rows

function rowY(r) { return DIAG_TOP + r * (NH + ROW_GAP) }  // r = 0..5

// Row assignments:
// r0  Client: Public Visitor
// r1  Client: Admin Browser           Vercel: Edge Middleware        (AWS layer starts)
// r2  Vercel: Next.js App Router      AWS: RDS
// r3  Vercel: Server Comps + Actions  AWS: Bedrock
// r4  Vercel: AI Gateway              Supabase: Auth
// r5  Vercel: Blob

const PUB_Y   = rowY(0)
const ADM_Y   = rowY(1)
const EDGE_Y  = rowY(1)
const NEXT_Y  = rowY(2)
const SCSA_Y  = rowY(3)
const GW_Y    = rowY(4)
const BLOB_Y  = rowY(5)

const RDS_Y   = rowY(2)
const BED_Y   = rowY(3)
const AUTH_Y  = rowY(4)

// ── Layer bounding boxes ──────────────────────────────────────────────────────
// Client layer: rows 0–1
const CL_Y = DIAG_TOP - 4
const CL_H = rowY(1) + NH + 8 - CL_Y

// Vercel layer: rows 1–5
const VL_Y = rowY(1) - 4
const VL_H = rowY(5) + NH + 12 - VL_Y

// AWS layer: rows 2–3
const AL_Y = rowY(2) - 4
const AL_H = rowY(3) + NH + 12 - AL_Y

// Supabase layer: row 4
const SL_Y = rowY(4) - 4
const SL_H = NH + 16

// ── Helper: node X inside each column ────────────────────────────────────────
function nx(colX) { return colX + 12 }
function nodeRight(colX) { return colX + 12 + NW }
function nodeLeft(colX)  { return colX + 12 }
function nodeMidY(y)     { return y + NH / 2 }
function nodeMidX(colX)  { return colX + 12 + NW / 2 }

// ── Renderers ─────────────────────────────────────────────────────────────────
function layerRect(x, y, w, h, label, sublabel, stroke, fill) {
  return [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-dasharray="5 3"/>`,
    `<text x="${x + 14}" y="${y + 18}" font-family="'Inter',sans-serif" font-size="9.5" font-weight="700" letter-spacing="2.2" fill="${stroke}" opacity="0.85">${label.toUpperCase()}</text>`,
    sublabel ? `<text x="${x + 14}" y="${y + 31}" font-family="'JetBrains Mono',monospace" font-size="8.5" fill="${stroke}" opacity="0.45">${sublabel}</text>` : '',
  ].filter(Boolean).join('\n')
}

function node(x, y, w, h, { fill, stroke, label, sublabel, icon }) {
  const tx = icon ? x + 44 : x + 14
  return [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${NR}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`,
    `<rect x="${x}" y="${y + 8}" width="3" height="${h - 16}" rx="1.5" fill="${stroke}"/>`,
    icon ? `<circle cx="${x + 22}" cy="${y + h / 2}" r="11" fill="${stroke}18"/>` : '',
    icon ? `<text x="${x + 22}" y="${y + h / 2 + 5}" text-anchor="middle" font-size="13" fill="${stroke}">${icon}</text>` : '',
    `<text x="${tx}" y="${y + h / 2 - (sublabel ? 7 : 0)}" dominant-baseline="middle"
       font-family="'Inter',sans-serif" font-size="13" font-weight="600" fill="${C.textPrimary}">${label}</text>`,
    sublabel ? `<text x="${tx}" y="${y + h / 2 + 11}" dominant-baseline="middle"
       font-family="'JetBrains Mono',monospace" font-size="9.5" fill="${C.textSec}">${sublabel}</text>` : '',
  ].filter(Boolean).join('\n')
}

// Straight arrow with optional inline label
function line(x1, y1, x2, y2, { color = C.textMuted, dashed = false, label = '', markerId = 'arr', lx, ly } = {}) {
  const dash = dashed ? ' stroke-dasharray="5 3"' : ''
  const mx = lx ?? (x1 + x2) / 2
  const my = ly ?? (y1 + y2) / 2
  return [
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5"${dash} marker-end="url(#${markerId})"/>`,
    label ? `<rect x="${mx - 46}" y="${my - 9}" width="92" height="17" rx="4" fill="${C.bg}" opacity="0.9"/>` : '',
    label ? `<text x="${mx}" y="${my + 0.5}" text-anchor="middle" dominant-baseline="middle" font-family="'JetBrains Mono',monospace" font-size="8.5" fill="${color}">${label}</text>` : '',
  ].filter(Boolean).join('\n')
}

// Cubic bezier arrow
function curve(x1, y1, x2, y2, cp1x, cp1y, cp2x, cp2y, { color = C.textMuted, dashed = false, label = '', markerId = 'arr', lx, ly } = {}) {
  const dash = dashed ? ' stroke-dasharray="5 3"' : ''
  const mx = lx ?? (cp1x + cp2x) / 2
  const my = ly ?? (cp1y + cp2y) / 2
  return [
    `<path d="M${x1},${y1} C${cp1x},${cp1y} ${cp2x},${cp2y} ${x2},${y2}" stroke="${color}" stroke-width="1.5" fill="none"${dash} marker-end="url(#${markerId})"/>`,
    label ? `<rect x="${mx - 48}" y="${my - 9}" width="96" height="17" rx="4" fill="${C.bg}" opacity="0.9"/>` : '',
    label ? `<text x="${mx}" y="${my + 0.5}" text-anchor="middle" dominant-baseline="middle" font-family="'JetBrains Mono',monospace" font-size="8.5" fill="${color}">${label}</text>` : '',
  ].filter(Boolean).join('\n')
}

// ── Assemble ──────────────────────────────────────────────────────────────────
const p = []   // parts

// defs
p.push(`<defs>
  ${['arr','arr-em','arr-sky','arr-fu','arr-teal','arr-ind'].map((id, i) => {
    const fills = [C.textMuted, C.emerald, C.sky, C.fuchsia, C.teal, C.indigo]
    return `<marker id="${id}" markerWidth="7" markerHeight="5" refX="6" refY="2.5" orient="auto">
      <polygon points="0 0,7 2.5,0 5" fill="${fills[i]}"/>
    </marker>`
  }).join('\n  ')}
</defs>`)

// Background
p.push(`<rect width="${W}" height="${H}" fill="${C.bg}"/>`)

// Subtle dot grid
p.push(`<g opacity="0.035">`)
for (let gx = 0; gx < W; gx += 36) {
  for (let gy = 0; gy < H; gy += 36) {
    p.push(`<circle cx="${gx}" cy="${gy}" r="0.8" fill="${C.textSec}"/>`)
  }
}
p.push(`</g>`)

// Title
p.push(`<text x="${W/2}" y="${TITLE_Y}" text-anchor="middle"
  font-family="'Inter',sans-serif" font-size="20" font-weight="700" fill="${C.textPrimary}">Last 2 Lines — Application Architecture &amp; Data Flow</text>`)
p.push(`<text x="${W/2}" y="${SUB_Y}" text-anchor="middle"
  font-family="'JetBrains Mono',monospace" font-size="10.5" fill="${C.textMuted}">Next.js 16 · AWS RDS PostgreSQL · AWS Bedrock · Supabase Auth · Vercel Blob · AI SDK 6</text>`)

// ── Layer rectangles ──────────────────────────────────────────────────────────
p.push(layerRect(COL1X,    CL_Y, COL_W, CL_H,   'Clients',  '',                    C.emerald, C.layerClient))
p.push(layerRect(COL2X,    VL_Y, COL_W, VL_H,   'Vercel',   'Fluid Compute',       C.sky,     C.layerVercel))
p.push(layerRect(COL3X,    AL_Y, COL_W, AL_H,   'AWS',      'IAM / OIDC auth',     C.orange,  C.layerAWS))
p.push(layerRect(COL3X,    SL_Y, COL_W, SL_H,   'Supabase', 'admin auth only',     C.teal,    C.layerSupabase))

// ── Nodes ─────────────────────────────────────────────────────────────────────
// Col 1 – Clients
p.push(node(nx(COL1X), PUB_Y, NW, NH, {
  fill: '#0c1f10', stroke: C.emerald,
  label: 'Public Visitor', sublabel: 'React 19 · Client Components · form submission',
  icon: '⊕',
}))
p.push(node(nx(COL1X), ADM_Y, NW, NH, {
  fill: '#1e1605', stroke: C.amber,
  label: 'Admin Browser', sublabel: 'Supabase Auth UI · authenticated session',
  icon: '⊙',
}))

// Col 2 – Vercel
p.push(node(nx(COL2X), EDGE_Y, NW, NH, {
  fill: '#15103a', stroke: C.violet,
  label: 'Edge Middleware', sublabel: 'proxy.ts · Supabase SSR session refresh',
  icon: '⟳',
}))
p.push(node(nx(COL2X), NEXT_Y, NW, NH, {
  fill: '#0a1628', stroke: C.sky,
  label: 'Next.js 16 App Router', sublabel: 'Turbopack · App Router · Fluid Compute',
  icon: '▲',
}))

// SC + SA side by side
const HALF = Math.floor((NW - 10) / 2)
p.push(node(nx(COL2X),          SCSA_Y, HALF, NH, {
  fill: '#081422', stroke: '#7dd3fc',
  label: 'Server', sublabel: 'Components · lib/queries',
  icon: '⊞',
}))
p.push(node(nx(COL2X) + HALF + 10, SCSA_Y, HALF, NH, {
  fill: '#081422', stroke: '#bae6fd',
  label: 'Server', sublabel: 'Actions · lib/actions',
  icon: '⚡',
}))

p.push(node(nx(COL2X), GW_Y, NW, NH, {
  fill: '#1c0a28', stroke: C.fuchsia,
  label: 'Vercel AI Gateway', sublabel: 'OIDC token · AI SDK 6 · Bedrock proxy',
  icon: '⚡',
}))
p.push(node(nx(COL2X), BLOB_Y, NW, NH, {
  fill: '#10103a', stroke: C.indigo,
  label: 'Vercel Blob', sublabel: 'Campaign images · PUT /api/upload · CDN URL',
  icon: '⬡',
}))

// Col 3 – AWS + Supabase
p.push(node(nx(COL3X), RDS_Y, NW, NH, {
  fill: '#1c1205', stroke: C.orange,
  label: 'AWS RDS PostgreSQL', sublabel: 'IAM auth · TLS · pool:5 · rds-signer',
  icon: '⊛',
}))
p.push(node(nx(COL3X), BED_Y, NW, NH, {
  fill: '#1c0810', stroke: C.rose,
  label: 'AWS Bedrock', sublabel: 'amazon/nova-micro · { decision, confidence }',
  icon: '◈',
}))
p.push(node(nx(COL3X), AUTH_Y, NW, NH, {
  fill: '#051815', stroke: C.teal,
  label: 'Supabase Auth', sublabel: 'email/password · SSR cookie · per-request client',
  icon: '⬡',
}))

// ── Arrows ────────────────────────────────────────────────────────────────────

// 1. Public Visitor → Edge Middleware  (HTTPS request)
const pubRight  = nodeRight(COL1X)
const edgeLeft  = nodeLeft(COL2X)
const pubMidY   = nodeMidY(PUB_Y)
const edgeMidY  = nodeMidY(EDGE_Y)
p.push(line(pubRight, pubMidY, edgeLeft, edgeMidY, {
  color: C.emerald, markerId: 'arr-em', label: 'HTTPS request',
}))

// 2. Admin Browser → Edge Middleware  (dashed amber)
const admMidY = nodeMidY(ADM_Y)
const admRight = nodeRight(COL1X)
// elbow: across then up to edge entry point
p.push(curve(admRight, admMidY, edgeLeft, edgeMidY + 12,
  admRight + 20, admMidY, edgeLeft - 20, edgeMidY + 12,
  { color: C.amber, dashed: true, label: 'admin request', markerId: 'arr', lx: (admRight + edgeLeft)/2, ly: admMidY - 6 }
))

// 3. Edge Middleware → Next.js App Router (vertical, same column)
const edgeBot   = EDGE_Y + NH
const nextTop   = NEXT_Y
const col2MidX  = nodeMidX(COL2X)
p.push(line(col2MidX, edgeBot, col2MidX, nextTop, {
  color: C.violet, markerId: 'arr', label: 'passes through',
  lx: col2MidX, ly: (edgeBot + nextTop) / 2,
}))

// 4a. Next.js → Server Components (left fork down)
const SCcx = nx(COL2X) + HALF / 2
const SAcx = nx(COL2X) + HALF + 10 + HALF / 2
p.push(line(SCcx, NEXT_Y + NH, SCcx, SCSA_Y, { color: C.sky, markerId: 'arr-sky' }))
// 4b. Next.js → Server Actions (right fork down)
p.push(line(SAcx, NEXT_Y + NH, SAcx, SCSA_Y, { color: C.sky, markerId: 'arr-sky' }))

// 5. Server Components → AWS RDS (SQL read)
const scRight = nx(COL2X) + HALF
const rdsLeft = nodeLeft(COL3X)
const scMidY  = nodeMidY(SCSA_Y)
const rdsMidY = nodeMidY(RDS_Y)
p.push(curve(scRight, scMidY - 8, rdsLeft, rdsMidY,
  scRight + 28, scMidY - 8, rdsLeft - 28, rdsMidY,
  { color: C.sky, markerId: 'arr-sky', label: 'SQL read', lx: (scRight + rdsLeft) / 2, ly: scMidY - 18 }
))

// 6. Server Actions → AWS RDS (SQL write, dashed)
const saLeft2 = nx(COL2X) + HALF + 10
const saRight = saLeft2 + HALF
p.push(curve(saRight, nodeMidY(SCSA_Y) + 8, rdsLeft, rdsMidY + 12,
  saRight + 20, nodeMidY(SCSA_Y) + 8, rdsLeft - 18, rdsMidY + 12,
  { color: '#bae6fd', dashed: true, markerId: 'arr', label: 'SQL write', lx: (saRight + rdsLeft) / 2, ly: nodeMidY(SCSA_Y) + 26 }
))

// 7. Server Actions → Vercel AI Gateway (vertical, dashed fuchsia)
const gwTop = GW_Y
const saMidX = SAcx
p.push(line(saMidX, SCSA_Y + NH, saMidX, gwTop, {
  color: C.fuchsia, dashed: true, markerId: 'arr-fu', label: 'moderate couplet',
  lx: saMidX + 38, ly: (SCSA_Y + NH + gwTop) / 2,
}))

// 8. Vercel AI Gateway → AWS Bedrock
const gwRight  = nodeRight(COL2X)
const bedLeft  = nodeLeft(COL3X)
const gwMidY   = nodeMidY(GW_Y)
const bedMidY  = nodeMidY(BED_Y)
p.push(curve(gwRight, gwMidY, bedLeft, bedMidY,
  gwRight + 28, gwMidY, bedLeft - 28, bedMidY,
  { color: C.fuchsia, markerId: 'arr-fu', label: 'OIDC → inference', lx: (gwRight + bedLeft) / 2, ly: (gwMidY + bedMidY) / 2 - 4 }
))

// 9. Admin Browser → Supabase Auth (long sweep, dashed teal)
// Route: exits client-right, curves right and down to supabase-left
const authLeft = nodeLeft(COL3X)
const authMidY = nodeMidY(AUTH_Y)
p.push(curve(admRight, admMidY, authLeft, authMidY,
  admRight + 120, admMidY + 180, authLeft - 60, authMidY,
  { color: C.teal, dashed: true, markerId: 'arr-teal', label: 'sign-in (SSR cookie)', lx: admRight + 110, ly: admMidY + 110 }
))

// 10. Admin Browser → Vercel Blob (image upload, dashed indigo)
const blobLeft  = nodeLeft(COL2X)
const blobMidY  = nodeMidY(BLOB_Y)
p.push(curve(admRight, admMidY + 6, blobLeft, blobMidY,
  admRight + 30, admMidY + 200, blobLeft - 20, blobMidY,
  { color: C.indigo, dashed: true, markerId: 'arr-ind', label: 'image upload', lx: admRight + 26, ly: admMidY + 145 }
))

// ── Legend ────────────────────────────────────────────────────────────────────
const LEG_Y  = H - 42
const LEG_H  = 34
const LEG_X  = PAD

const items = [
  { color: C.emerald, label: 'Public data flow',     dashed: false },
  { color: C.sky,     label: 'RSC / read queries',   dashed: false },
  { color: C.fuchsia, label: 'AI moderation',        dashed: false },
  { color: C.teal,    label: 'Auth session (SSR)',   dashed: true  },
  { color: C.indigo,  label: 'Blob image upload',    dashed: true  },
  { color: C.amber,   label: 'Admin request',        dashed: true  },
]

p.push(`<rect x="${LEG_X - 4}" y="${LEG_Y - 4}" width="${W - PAD * 2 + 8}" height="${LEG_H}" rx="8"
  fill="${C.surface}" stroke="${C.border}" stroke-width="1"/>`)
p.push(`<text x="${LEG_X + 6}" y="${LEG_Y + 14}" font-family="'Inter',sans-serif"
  font-size="8.5" font-weight="700" letter-spacing="2" fill="${C.textMuted}">LEGEND</text>`)

items.forEach((item, i) => {
  const ix   = LEG_X + 72 + i * 186
  const iy   = LEG_Y + LEG_H / 2 - 2
  const dash = item.dashed ? ' stroke-dasharray="5 3"' : ''
  p.push(`<line x1="${ix}" y1="${iy}" x2="${ix + 28}" y2="${iy}" stroke="${item.color}" stroke-width="2"${dash}/>`)
  p.push(`<polygon points="${ix+28},${iy-3.5} ${ix+34},${iy} ${ix+28},${iy+3.5}" fill="${item.color}"/>`)
  p.push(`<text x="${ix + 40}" y="${iy + 4}" font-family="'Inter',sans-serif" font-size="10" fill="${C.textSec}">${item.label}</text>`)
})

// ── Output ────────────────────────────────────────────────────────────────────
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${p.join('\n')}
</svg>`

writeFileSync(OUT, svg, 'utf-8')
console.log(`✓ Saved ${W}×${H} SVG → ${OUT}`)
