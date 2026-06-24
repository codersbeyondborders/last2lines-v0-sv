/**
 * generate-data-model-svg.mjs
 * Produces public/data-model-diagram.svg — a full ERD with indexes,
 * FK relationships, CHECK constraints, and AWS RDS feature callouts.
 *
 * Run:  node scripts/generate-data-model-svg.mjs
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '..', 'public', 'data-model-diagram.svg')

// ─── palette ─────────────────────────────────────────────────────────────────
const C = {
  bg:          '#0f1117',
  surface:     '#161b22',
  surfaceAlt:  '#1c2333',
  border:      '#30363d',
  borderLight: '#3d444d',
  emerald:     '#34d399',
  emeraldDim:  '#065f46',
  emeraldFaint:'#022c22',
  amber:       '#fbbf24',
  amberDim:    '#78350f',
  sky:         '#38bdf8',
  skyDim:      '#0c4a6e',
  violet:      '#a78bfa',
  violetDim:   '#3b0764',
  rose:        '#fb7185',
  roseDim:     '#881337',
  text:        '#e6edf3',
  textMuted:   '#8b949e',
  textFaint:   '#484f58',
  white:       '#ffffff',
  pkYellow:    '#f0c929',
  fkOrange:    '#e07b39',
  typeGray:    '#6e7681',
}

// ─── layout constants ─────────────────────────────────────────────────────────
const W          = 1600
const TABLE_W    = 280
const COL_H      = 28
const HEADER_H   = 38
const SECTION_H  = 22   // index / constraint section header
const INDEX_H    = 20

// ─── table definitions ────────────────────────────────────────────────────────

const tables = [
  {
    id: 'campaigns',
    label: 'campaigns',
    color: C.emerald,
    colorDim: C.emeraldDim,
    colorFaint: C.emeraldFaint,
    columns: [
      { name: 'id',                       type: 'TEXT',         pk: true  },
      { name: 'slug',                      type: 'TEXT',         uk: true  },
      { name: 'title',                     type: 'TEXT'                    },
      { name: 'tagline',                   type: 'TEXT'                    },
      { name: 'description',               type: 'TEXT'                    },
      { name: 'instructions',              type: 'TEXT[]'                  },
      { name: 'theme',                     type: 'VARCHAR(50)'             },
      { name: 'accent_color',              type: 'VARCHAR(50)'             },
      { name: 'status',                    type: 'VARCHAR(20)',  check: true },
      { name: 'ai_moderation',             type: 'BOOLEAN'                 },
      { name: 'ai_level',                  type: 'VARCHAR(20)',  check: true },
      { name: 'background_image_url',      type: 'TEXT'                    },
      { name: 'campaign_images',           type: 'TEXT[]'                  },
      { name: 'video_link',                type: 'TEXT',         null: true },
      { name: 'donation_link',             type: 'TEXT',         null: true },
      { name: 'require_email_verification',type: 'BOOLEAN'                 },
      { name: 'auto_email_on_publish',     type: 'BOOLEAN'                 },
      { name: 'start_date',                type: 'TIMESTAMPTZ'             },
      { name: 'close_date',                type: 'TIMESTAMPTZ'             },
      { name: 'created_at',                type: 'TIMESTAMPTZ'             },
      { name: 'updated_at',                type: 'TIMESTAMPTZ'             },
    ],
    indexes: [
      { name: 'idx_campaigns_status', cols: 'status',      type: 'btree' },
      { name: 'idx_campaigns_slug',   cols: 'slug',        type: 'btree' },
    ],
    checks: [
      "status IN ('draft','active','paused','completed','archived')",
      "ai_level IN ('lenient','standard','strict')",
    ],
  },
  {
    id: 'authors',
    label: 'authors',
    color: C.sky,
    colorDim: C.skyDim,
    colorFaint: '#071f33',
    columns: [
      { name: 'id',        type: 'TEXT',        pk: true  },
      { name: 'name',      type: 'TEXT',        null: true },
      { name: 'email',     type: 'TEXT',        uk: true  },
      { name: 'country',   type: 'TEXT',        null: true },
      { name: 'status',    type: 'VARCHAR(20)', check: true },
      { name: 'joined_at', type: 'TIMESTAMPTZ'            },
    ],
    indexes: [
      { name: 'idx_authors_status',       cols: 'status',         type: 'btree'   },
      { name: 'idx_authors_email_status', cols: 'email, status',  type: 'btree'   },
      { name: 'idx_authors_country',      cols: 'country',        type: 'btree', partial: 'WHERE country IS NOT NULL' },
    ],
    checks: [
      "status IN ('active','banned')",
    ],
  },
  {
    id: 'contributions',
    label: 'contributions',
    color: C.violet,
    colorDim: C.violetDim,
    colorFaint: '#1e0a3c',
    columns: [
      { name: 'id',                  type: 'TEXT',        pk: true  },
      { name: 'campaign_id',         type: 'TEXT',        fk: 'campaigns.id', onDelete: 'CASCADE' },
      { name: 'sequence_number',     type: 'INT'                    },
      { name: 'line_one',            type: 'TEXT'                   },
      { name: 'line_two',            type: 'TEXT'                   },
      { name: 'author_id',           type: 'TEXT',        fk: 'authors.id', onDelete: 'CASCADE' },
      { name: 'status',              type: 'VARCHAR(20)', check: true },
      { name: 'moderation_reason',   type: 'TEXT',        null: true },
      { name: 'email_verified',      type: 'BOOLEAN'                },
      { name: 'publish_email_sent_at',type: 'TIMESTAMPTZ',null: true },
      { name: 'created_at',          type: 'TIMESTAMPTZ'            },
    ],
    indexes: [
      { name: 'idx_contributions_campaign',        cols: 'campaign_id',                           type: 'btree' },
      { name: 'idx_contributions_author',          cols: 'author_id',                             type: 'btree' },
      { name: 'idx_contributions_status',          cols: 'status',                                type: 'btree' },
      { name: 'idx_contributions_campaign_status', cols: 'campaign_id, status',                   type: 'btree' },
      { name: 'idx_contributions_created_at',      cols: 'created_at DESC',                       type: 'btree', note: 'keyset pagination' },
      { name: 'idx_contributions_campaign_author', cols: 'campaign_id, author_id',                type: 'btree' },
      { name: 'idx_contributions_poem',            cols: 'campaign_id, sequence_number DESC',     type: 'btree', partial: "WHERE status = 'approved'" },
    ],
    checks: [
      "status IN ('pending','approved','rejected')",
    ],
  },
  {
    id: 'moderation_settings',
    label: 'moderation_settings',
    color: C.amber,
    colorDim: C.amberDim,
    colorFaint: '#2a1800',
    columns: [
      { name: 'id',                   type: 'TEXT',          pk: true },
      { name: 'campaign_id',          type: 'TEXT',          fk: 'campaigns.id', onDelete: 'CASCADE', uk: true },
      { name: 'level',                type: 'VARCHAR(20)',    check: true },
      { name: 'profanity_filter',     type: 'BOOLEAN'                 },
      { name: 'enforce_theme',        type: 'BOOLEAN'                 },
      { name: 'confidence_threshold', type: 'NUMERIC(3,2)'            },
      { name: 'updated_at',           type: 'TIMESTAMPTZ'             },
    ],
    indexes: [],
    checks: [
      "level IN ('lenient','standard','strict')",
    ],
  },
  {
    id: 'email_otps',
    label: 'email_otps',
    color: C.rose,
    colorDim: C.roseDim,
    colorFaint: '#2a0818',
    columns: [
      { name: 'id',          type: 'TEXT',        pk: true  },
      { name: 'email',       type: 'TEXT'                   },
      { name: 'campaign_id', type: 'TEXT',        fk: 'campaigns.id', onDelete: 'CASCADE' },
      { name: 'code_hash',   type: 'TEXT',        note: 'SHA-256 hex' },
      { name: 'expires_at',  type: 'TIMESTAMPTZ'            },
      { name: 'used',        type: 'BOOLEAN'                },
      { name: 'created_at',  type: 'TIMESTAMPTZ'            },
    ],
    indexes: [
      { name: 'idx_email_otps_active',  cols: 'email, campaign_id, expires_at', type: 'btree', partial: 'WHERE used = false', note: 'replaces broad idx' },
      { name: 'idx_email_otps_expires', cols: 'expires_at',                     type: 'btree', note: 'TTL/cleanup scans' },
    ],
    checks: [],
  },
]

// ─── helpers ─────────────────────────────────────────────────────────────────

function escXml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function tableHeight(t) {
  const colsH = t.columns.length * COL_H
  const idxH  = t.indexes.length  > 0 ? SECTION_H + t.indexes.length * INDEX_H  : 0
  const chkH  = t.checks.length   > 0 ? SECTION_H + t.checks.length  * INDEX_H  : 0
  return HEADER_H + colsH + idxH + chkH + 8
}

// ─── position tables ─────────────────────────────────────────────────────────
// col 0 x=60  — campaigns, email_otps
// col 1 x=480 — contributions
// col 2 x=900 — authors
// col 3 x=1320 (not needed — moderation_settings on col 2 offset)

const positions = {
  campaigns:            { x: 60,  y: 60  },
  email_otps:           { x: 60,  y: 480 },
  contributions:        { x: 440, y: 60  },
  moderation_settings:  { x: 440, y: 680 },
  authors:              { x: 900, y: 60  },
}

// ─── compute total SVG height ─────────────────────────────────────────────────
const AWS_PANEL_Y   = 60
const AWS_PANEL_H   = 540
const AWS_PANEL_X   = 1240
const AWS_PANEL_W   = 320

// max bottom of any table
const maxBottom = Object.entries(positions).reduce((m, [id, pos]) => {
  const t = tables.find(t => t.id === id)
  return Math.max(m, pos.y + tableHeight(t))
}, 0)

const LEGEND_Y = maxBottom + 40
const LEGEND_H = 90
const H = LEGEND_Y + LEGEND_H + 60

// ─── render a single table ────────────────────────────────────────────────────

function renderTable(t) {
  const pos = positions[t.id]
  const { x, y } = pos
  const h = tableHeight(t)
  let out = ''

  // Shadow
  out += `<rect x="${x+4}" y="${y+4}" width="${TABLE_W}" height="${h}" rx="8" fill="rgba(0,0,0,0.45)"/>`

  // Card bg
  out += `<rect x="${x}" y="${y}" width="${TABLE_W}" height="${h}" rx="8" fill="${C.surface}" stroke="${t.color}" stroke-width="1.5" stroke-opacity="0.6"/>`

  // Header band
  out += `<rect x="${x}" y="${y}" width="${TABLE_W}" height="${HEADER_H}" rx="8" fill="${t.color}" fill-opacity="0.15"/>`
  out += `<rect x="${x}" y="${y + HEADER_H - 4}" width="${TABLE_W}" height="4" fill="${t.color}" fill-opacity="0.08"/>`

  // Table icon + name
  out += `<text x="${x+14}" y="${y+24}" font-family="ui-monospace,SFMono-Regular,monospace" font-size="13" font-weight="700" fill="${t.color}">${escXml(t.label)}</text>`

  // DB icon (small square grid)
  const ix = x + TABLE_W - 22
  const iy = y + 10
  out += `<rect x="${ix}" y="${iy}" width="5" height="5" rx="1" fill="${t.color}" fill-opacity="0.7"/>`
  out += `<rect x="${ix+7}" y="${iy}" width="5" height="5" rx="1" fill="${t.color}" fill-opacity="0.7"/>`
  out += `<rect x="${ix}" y="${iy+7}" width="5" height="5" rx="1" fill="${t.color}" fill-opacity="0.7"/>`
  out += `<rect x="${ix+7}" y="${iy+7}" width="5" height="5" rx="1" fill="${t.color}" fill-opacity="0.7"/>`

  // Divider
  out += `<line x1="${x}" y1="${y+HEADER_H}" x2="${x+TABLE_W}" y2="${y+HEADER_H}" stroke="${t.color}" stroke-opacity="0.25" stroke-width="1"/>`

  // Columns
  t.columns.forEach((col, i) => {
    const cy = y + HEADER_H + i * COL_H
    const isEven = i % 2 === 0
    if (isEven) out += `<rect x="${x+1}" y="${cy}" width="${TABLE_W-2}" height="${COL_H}" fill="${C.white}" fill-opacity="0.015"/>`

    // PK/FK/UK badge
    let badge = ''
    if      (col.pk) badge = 'PK'
    else if (col.fk) badge = 'FK'
    else if (col.uk) badge = 'UK'

    if (badge) {
      const badgeColor = col.pk ? C.pkYellow : col.fk ? C.fkOrange : C.emerald
      out += `<rect x="${x+8}" y="${cy+7}" width="20" height="14" rx="3" fill="${badgeColor}" fill-opacity="0.18"/>`
      out += `<text x="${x+18}" y="${cy+18}" text-anchor="middle" font-family="ui-monospace,monospace" font-size="8.5" font-weight="700" fill="${badgeColor}">${badge}</text>`
    }

    // Column name
    const nameColor = col.pk ? C.pkYellow : col.fk ? C.fkOrange : col.null ? C.textMuted : C.text
    out += `<text x="${x+34}" y="${cy+18}" font-family="ui-monospace,SFMono-Regular,monospace" font-size="11" fill="${nameColor}">${escXml(col.name)}</text>`

    // Type
    let typeLabel = col.type
    if (col.note) typeLabel += ` /* ${col.note} */`
    out += `<text x="${x+TABLE_W-8}" y="${cy+18}" text-anchor="end" font-family="ui-monospace,monospace" font-size="9.5" fill="${C.typeGray}">${escXml(typeLabel)}</text>`

    // CHECK indicator dot
    if (col.check) {
      out += `<circle cx="${x+TABLE_W-24}" cy="${cy+14}" r="3" fill="${C.amber}" fill-opacity="0.6"/>`
    }
    // NULL indicator
    if (col.null) {
      out += `<text x="${x+TABLE_W-10}" y="${cy+18}" text-anchor="end" font-family="ui-sans-serif,sans-serif" font-size="8" fill="${C.textFaint}" font-style="italic">null</text>`
    }

    // Divider after each col
    out += `<line x1="${x+4}" y1="${cy+COL_H}" x2="${x+TABLE_W-4}" y2="${cy+COL_H}" stroke="${C.border}" stroke-width="0.5" stroke-opacity="0.5"/>`
  })

  let curY = y + HEADER_H + t.columns.length * COL_H

  // Indexes section
  if (t.indexes.length > 0) {
    out += `<rect x="${x}" y="${curY}" width="${TABLE_W}" height="${SECTION_H}" fill="${t.colorFaint}"/>`
    out += `<text x="${x+10}" y="${curY+15}" font-family="ui-sans-serif,sans-serif" font-size="9.5" font-weight="600" fill="${t.color}" fill-opacity="0.9" letter-spacing="0.08em">INDEXES</text>`
    curY += SECTION_H

    t.indexes.forEach((idx) => {
      out += `<rect x="${x+1}" y="${curY}" width="${TABLE_W-2}" height="${INDEX_H}" fill="${t.colorFaint}"/>`

      // lightning bolt icon
      out += `<text x="${x+8}" y="${curY+14}" font-family="ui-sans-serif,sans-serif" font-size="9" fill="${t.color}" fill-opacity="0.7">⚡</text>`

      const label = idx.partial ? `${idx.name} [partial]` : idx.name
      out += `<text x="${x+20}" y="${curY+14}" font-family="ui-monospace,monospace" font-size="9" fill="${C.textMuted}">${escXml(label)}</text>`
      // cols hint on right
      out += `<text x="${x+TABLE_W-6}" y="${curY+14}" text-anchor="end" font-family="ui-monospace,monospace" font-size="8" fill="${C.textFaint}">(${escXml(idx.cols)})</text>`

      out += `<line x1="${x+4}" y1="${curY+INDEX_H}" x2="${x+TABLE_W-4}" y2="${curY+INDEX_H}" stroke="${C.border}" stroke-width="0.4" stroke-opacity="0.4"/>`
      curY += INDEX_H
    })
  }

  // Checks section
  if (t.checks.length > 0) {
    out += `<rect x="${x}" y="${curY}" width="${TABLE_W}" height="${SECTION_H}" fill="rgba(251,191,36,0.04)"/>`
    out += `<text x="${x+10}" y="${curY+15}" font-family="ui-sans-serif,sans-serif" font-size="9.5" font-weight="600" fill="${C.amber}" fill-opacity="0.9" letter-spacing="0.08em">CONSTRAINTS</text>`
    curY += SECTION_H

    t.checks.forEach((chk) => {
      out += `<rect x="${x+1}" y="${curY}" width="${TABLE_W-2}" height="${INDEX_H}" fill="rgba(251,191,36,0.03)"/>`
      out += `<text x="${x+8}" y="${curY+14}" font-family="ui-monospace,monospace" font-size="8" fill="${C.amber}" fill-opacity="0.65">${escXml('✓ ' + chk)}</text>`
      out += `<line x1="${x+4}" y1="${curY+INDEX_H}" x2="${x+TABLE_W-4}" y2="${curY+INDEX_H}" stroke="${C.border}" stroke-width="0.4" stroke-opacity="0.3"/>`
      curY += INDEX_H
    })
  }

  // Bottom rounded cap
  out += `<rect x="${x}" y="${y+h-8}" width="${TABLE_W}" height="8" rx="8" fill="${C.surface}"/>`
  out += `<rect x="${x+1}" y="${y+h-8}" width="${TABLE_W-2}" height="4" fill="${C.surface}"/>`

  return out
}

// ─── FK arrow helper ──────────────────────────────────────────────────────────

function colMidY(tableId, colName) {
  const t   = tables.find(t => t.id === tableId)
  const pos = positions[tableId]
  const idx = t.columns.findIndex(c => c.name === colName)
  return pos.y + HEADER_H + idx * COL_H + COL_H / 2
}

function tableRight(tableId) {
  return positions[tableId].x + TABLE_W
}
function tableLeft(tableId) {
  return positions[tableId].x
}
function tableTop(tableId) {
  return positions[tableId].y
}

function arrow(x1, y1, x2, y2, color, dashed = false) {
  const dashAttr = dashed ? 'stroke-dasharray="5,3"' : ''
  // slight bezier
  const cx1 = x1 + (x2 - x1) * 0.5
  const cy1 = y1
  const cx2 = x1 + (x2 - x1) * 0.5
  const cy2 = y2
  return `
    <path d="M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}"
      fill="none" stroke="${color}" stroke-width="1.5" stroke-opacity="0.7"
      ${dashAttr} marker-end="url(#arrowhead-${color.replace('#','')})"/>
  `
}

// ─── build FK arrows ─────────────────────────────────────────────────────────

function buildArrows() {
  const fkPairs = []
  tables.forEach(t => {
    t.columns.forEach(col => {
      if (!col.fk) return
      const [refTable, refCol] = col.fk.split('.')
      fkPairs.push({ from: t.id, fromCol: col.name, to: refTable, toCol: refCol, color: t.color })
    })
  })

  let out = ''
  fkPairs.forEach(({ from, fromCol, to, toCol, color }) => {
    const x1 = tableLeft(from)
    const y1 = colMidY(from, fromCol)
    const x2 = tableRight(to)
    const y2 = colMidY(to, toCol)

    // If from-table is to the right of to-table, draw from left → right of target
    const fromLeft  = tableLeft(from)
    const toRight   = tableRight(to)
    const toLeft    = tableLeft(to)

    let sx, ex
    if (fromLeft > toRight) {
      // from is to the right
      sx = fromLeft
      ex = toRight
    } else {
      // from is to the left
      sx = tableRight(from)
      ex = toLeft
    }

    out += arrow(sx, y1, ex, y2, color)
  })
  return out
}

// ─── AWS RDS panel ────────────────────────────────────────────────────────────

function awsPanel() {
  const x = AWS_PANEL_X
  const y = AWS_PANEL_Y
  const w = AWS_PANEL_W
  const h = AWS_PANEL_H

  const features = [
    {
      icon: '🔐',
      title: 'IAM Token Auth',
      body: '@aws-sdk/rds-signer generates\na short-lived IAM auth token\nper connection — no static password.',
      color: C.emerald,
    },
    {
      icon: '🪪',
      title: 'OIDC Federation',
      body: 'awsCredentialsProvider({ roleArn })\nexchanges a Vercel OIDC JWT for\ntemporary AWS STS credentials.',
      color: C.sky,
    },
    {
      icon: '🔁',
      title: 'Connection Pooling',
      body: 'pg.Pool with max=5 per function.\nattachDatabasePool() warms the\npool across invocations on Vercel.',
      color: C.violet,
    },
    {
      icon: '⚡',
      title: 'RDS Proxy (recommended)',
      body: 'Proxy multiplexes client pools\nonto a small set of real DB\nconnections — avoids max_connections.',
      color: C.amber,
    },
    {
      icon: '🔒',
      title: 'SSL / TLS in-transit',
      body: 'ssl: { rejectUnauthorized: false }\nforces TLS for all client→RDS\nconnections even in private VPC.',
      color: C.rose,
    },
    {
      icon: '🗂️',
      title: 'Partial Indexes',
      body: 'idx_contributions_poem WHERE approved\nidx_email_otps_active WHERE used=false\nidx_authors_country WHERE NOT NULL',
      color: C.textMuted,
    },
  ]

  let out = ''

  // Panel bg
  out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${C.surfaceAlt}" stroke="#f97316" stroke-width="1.5" stroke-opacity="0.5"/>`
  // Header strip
  out += `<rect x="${x}" y="${y}" width="${w}" height="36" rx="10" fill="rgba(249,115,22,0.15)"/>`
  out += `<rect x="${x}" y="${y+28}" width="${w}" height="8" fill="rgba(249,115,22,0.07)"/>`
  out += `<text x="${x+16}" y="${y+23}" font-family="ui-sans-serif,sans-serif" font-size="13" font-weight="700" fill="#f97316">AWS RDS Aurora PostgreSQL Features</text>`

  let fy = y + 50
  features.forEach((f) => {
    out += `<rect x="${x+10}" y="${fy}" width="${w-20}" height="68" rx="6" fill="${C.surface}" stroke="${f.color}" stroke-width="1" stroke-opacity="0.3"/>`
    out += `<rect x="${x+10}" y="${fy}" width="4" height="68" rx="2" fill="${f.color}" fill-opacity="0.7"/>`
    out += `<text x="${x+22}" y="${fy+16}" font-family="ui-sans-serif,sans-serif" font-size="11" font-weight="700" fill="${f.color}">${f.icon}  ${escXml(f.title)}</text>`
    const lines = f.body.split('\n')
    lines.forEach((line, li) => {
      out += `<text x="${x+22}" y="${fy+30+li*14}" font-family="ui-monospace,monospace" font-size="9.5" fill="${C.textMuted}">${escXml(line)}</text>`
    })
    fy += 78
  })

  return out
}

// ─── legend ───────────────────────────────────────────────────────────────────

function legend() {
  const lx = 60
  const ly = LEGEND_Y
  let out = ''

  out += `<rect x="${lx}" y="${ly}" width="${W - 120}" height="${LEGEND_H}" rx="8" fill="${C.surface}" stroke="${C.border}" stroke-width="1"/>`
  out += `<text x="${lx+20}" y="${ly+20}" font-family="ui-sans-serif,sans-serif" font-size="11" font-weight="700" fill="${C.textMuted}" letter-spacing="0.05em">LEGEND</text>`

  const items = [
    { color: C.pkYellow, label: 'PK — Primary Key' },
    { color: C.fkOrange, label: 'FK — Foreign Key (with ON DELETE CASCADE)' },
    { color: C.emerald,  label: 'UK — Unique constraint' },
    { color: C.amber,    label: '✓   CHECK constraint' },
    { color: C.sky,      label: '⚡  Index (btree)' },
    { color: '#f97316',  label: '◼   Partial Index (filtered)' },
    { color: C.textMuted,label: 'null — nullable column' },
  ]

  items.forEach((item, i) => {
    const ix = lx + 20 + i * 210
    const iy = ly + 45
    out += `<rect x="${ix}" y="${iy}" width="10" height="10" rx="2" fill="${item.color}" fill-opacity="0.85"/>`
    out += `<text x="${ix+16}" y="${iy+9}" font-family="ui-sans-serif,sans-serif" font-size="10" fill="${C.textMuted}">${escXml(item.label)}</text>`
  })

  // migration pills
  const migrations = [
    { label: '001-setup-schema.sql', color: C.emerald },
    { label: '002-email-otps.sql',   color: C.rose },
    { label: '004-schema-corrections.sql', color: C.amber },
    { label: '005-indexes.sql',      color: C.sky },
  ]
  const my = ly + LEGEND_H - 20
  out += `<text x="${lx+20}" y="${my}" font-family="ui-sans-serif,sans-serif" font-size="9.5" fill="${C.textFaint}">Migration files: </text>`
  let mx = lx + 108
  migrations.forEach((m) => {
    out += `<rect x="${mx}" y="${my-11}" width="${m.label.length * 5.8 + 12}" height="14" rx="4" fill="${m.color}" fill-opacity="0.12" stroke="${m.color}" stroke-width="0.8" stroke-opacity="0.4"/>`
    out += `<text x="${mx+6}" y="${my}" font-family="ui-monospace,monospace" font-size="8.5" fill="${m.color}">${escXml(m.label)}</text>`
    mx += m.label.length * 5.8 + 22
  })

  return out
}

// ─── defs: arrowhead markers ──────────────────────────────────────────────────

function defs() {
  const colors = [C.emerald, C.sky, C.violet, C.amber, C.rose]
  let out = '<defs>'
  colors.forEach(c => {
    const id = c.replace('#','')
    out += `
      <marker id="arrowhead-${id}" markerWidth="8" markerHeight="6"
              refX="7" refY="3" orient="auto">
        <polygon points="0 0, 8 3, 0 6" fill="${c}" fill-opacity="0.7"/>
      </marker>`
  })
  out += '</defs>'
  return out
}

// ─── title + subtitle ─────────────────────────────────────────────────────────

function titleBlock() {
  let out = ''
  out += `<text x="${W/2}" y="30" text-anchor="middle" font-family="ui-sans-serif,sans-serif" font-size="18" font-weight="700" fill="${C.text}">Last 2 Lines — Data Model</text>`
  out += `<text x="${W/2}" y="48" text-anchor="middle" font-family="ui-sans-serif,sans-serif" font-size="11" fill="${C.textMuted}">AWS Aurora PostgreSQL · 5 tables · 18 indexes (7 composite, 3 partial) · FK cascade</text>`
  return out
}

// ─── assemble SVG ─────────────────────────────────────────────────────────────

function buildSVG() {
  let body = ''

  // background
  body += `<rect width="${W}" height="${H}" fill="${C.bg}"/>`

  // subtle grid
  body += `<defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="${C.border}" stroke-width="0.3" stroke-opacity="0.3"/></pattern></defs>`
  body += `<rect width="${W}" height="${H}" fill="url(#grid)"/>`

  body += defs()
  body += titleBlock()

  // table group backgrounds (lane shading)
  body += `<rect x="40" y="52" width="${TABLE_W+40}" height="${maxBottom - 52 + 20}" rx="10" fill="rgba(255,255,255,0.01)" stroke="${C.border}" stroke-width="1" stroke-opacity="0.2" stroke-dasharray="6,4"/>`
  body += `<rect x="${440-10}" y="52" width="${TABLE_W+20}" height="${maxBottom - 52 + 20}" rx="10" fill="rgba(255,255,255,0.01)" stroke="${C.border}" stroke-width="1" stroke-opacity="0.2" stroke-dasharray="6,4"/>`
  body += `<rect x="${900-10}" y="52" width="${TABLE_W+20}" height="${tableHeight(tables.find(t=>t.id==='authors'))+20}" rx="10" fill="rgba(255,255,255,0.01)" stroke="${C.border}" stroke-width="1" stroke-opacity="0.2" stroke-dasharray="6,4"/>`

  // FK arrows (drawn before tables so tables sit on top)
  body += buildArrows()

  // tables
  tables.forEach(t => { body += renderTable(t) })

  // AWS panel
  body += awsPanel()

  // legend
  body += legend()

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
${body}
</svg>`
}

// ─── write ───────────────────────────────────────────────────────────────────
const svg = buildSVG()
writeFileSync(OUT, svg, 'utf-8')
console.log(`Written: ${OUT}  (${(svg.length/1024).toFixed(1)} KB)`)
