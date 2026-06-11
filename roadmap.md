# Last2Lines — Build Roadmap

> Transforming individual whispers into a global chorus for social good.
> An AI-powered poetry campaigning platform where users contribute exactly two lines of free-verse poetry to an active cause, stitched into one continuous living tapestry.

---

## 1. Product Summary

Last2Lines lets anyone add a **couplet (exactly two lines)** to an active campaign. All approved contributions are stitched together into a single, continuously scrolling poem — a "living tapestry" of collective sentiment. The flagship campaign is climate advocacy (*"Two Lines for the Earth"*), but the platform is reskinnable for crisis/peace movements, classrooms, community memory, and CSR.

**Design pillars**
- Minimalist, typography-first, peaceful (anti-outrage) aesthetic
- Deep forest emerald accent for the eco-advocacy flagship
- Working light/dark mode at all times
- WCAG 2.2 AA accessibility (AAC/screen-reader friendly)
- Low cognitive barrier: just two lines

---

## 2. Tech Stack (adapted for the v0 / Vercel environment)

| Layer | README target | v0 implementation plan |
| :-- | :-- | :-- |
| Framework | Next.js 15 App Router | **Next.js 16 App Router** (current), React 19, Server Components |
| UI | Tailwind + shadcn/ui | Tailwind v4 + shadcn/ui, lucide-react icons |
| Database | AWS Aurora/RDS MySQL | **Decision needed** — recommend Neon Postgres (default) or Amazon Aurora PostgreSQL if AWS parity is required |
| Auth (optional) | — | Better Auth on Neon if user accounts are needed |
| AI Moderation | OpenAI GPT-4o-mini | **Vercel AI Gateway** (zero-config, e.g. `openai/gpt-5-mini`) for profanity / theme-relevance / 2-line checks |
| Hosting | Vercel | Vercel |

> The README specifies AWS + OpenAI directly. Before backend work begins we should confirm whether to honor AWS Aurora PostgreSQL or use the Neon default, and confirm the AI Gateway is acceptable for moderation.

---

## 3. Data Model (draft)

**campaigns**
- `id`, `slug`, `title`, `description`, `theme` (e.g. climate), `accent_color`, `status` (active/archived), `created_at`

**contributions** (the couplets)
- `id`, `campaign_id` (FK), `line_one`, `line_two`, `author_name` (optional/anonymous), `country` (optional), `status` (pending/approved/rejected), `moderation_reason`, `created_at`

**moderation_log** (optional audit)
- `id`, `contribution_id`, `model`, `result`, `latency_ms`, `created_at`

---

## 4. Phased Roadmap

### Phase 0 — Foundation & Design System
- Configure globals.css tokens (light/dark), emerald accent, typography (2 font families max)
- Theme provider + working light/dark toggle
- App shell: header, footer, semantic landmarks (`header`/`main`/`section`/`article`)
- High-fidelity mock data arrays mirroring the SQL payload (no empty placeholder loops)

### Phase 1 — Public Campaign Experience (UI-first, mock data)
- **Landing / Hero**: campaign mission, live couplet counter, primary CTA
- **The Tapestry**: continuous stitched poem view of approved couplets (elegant text wrapping, no overflow / no horizontal scroll on mobile)
- **Contribution Form**: two line inputs, strict 2-line constraint, per-line character limits, live counters with `aria-live="polite"`, required-field validation, red warning borders, disabled submit until valid
- UI lifecycle states: loading spinners (lucide-react), empty/null results, validation/server error alerts

### Phase 2 — Moderation Dashboard (UI-first, mock data)
- Queue of pending contributions
- Approve / Reject actions that mutate local state instantly (optimistic UI)
- Filters (pending/approved/rejected), per-item moderation reason display
- Lifecycle states (loading, empty queue, error)

### Phase 3 — Database Integration
- Connect chosen DB (Neon or Aurora PostgreSQL)
- Create `campaigns` + `contributions` schema
- Server actions / route handlers for: fetch approved tapestry, submit contribution (pending), fetch moderation queue, approve/reject
- Replace mock arrays with real queries; keep per-query scoping/validation

### Phase 4 — AI Moderation Guardrails
- AI Gateway interceptor on submission: enforce 2-line semantics, profanity filter, campaign thematic relevance
- Auto-set status (approved / pending / rejected) with stored reason + latency
- Graceful fallback to manual moderation queue on AI failure/timeout

### Phase 5 — Multi-Campaign / Reskin Support
- Campaign switcher and theme tokens per campaign (climate, peace, classroom, community, CSR)
- Per-campaign accent color + copy
- Shareable campaign pages

### Phase 6 — Polish & Accessibility Audit
- Full keyboard navigability + visible `:focus-visible` rings
- WCAG 2.2 AA contrast pass in both themes
- SEO metadata + viewport in layout
- Browser verification of primary flows (submit, tapestry, moderate)

---

## 5. Open Questions (confirm before backend phases)
1. **Database**: Neon Postgres (v0 default) or Amazon Aurora PostgreSQL to match the AWS architecture?
2. **AI moderation**: OK to use Vercel AI Gateway instead of a direct OpenAI key?
3. **Auth**: Anonymous contributions only, or accounts for contributors/moderators?
4. **Moderation default**: AI auto-approve, or always route to a human queue first?

---

## 6. Suggested Build Order
1. Phase 0 + Phase 1 (public experience with mock data) — ship something visible first
2. Phase 2 (moderation dashboard, mock data)
3. Phase 3 (DB) → Phase 4 (AI moderation)
4. Phase 5 (multi-campaign) → Phase 6 (polish)
