# Last2Lines

> A collaborative poetry platform where the world writes one poem, two lines at a time — powered by AI moderation and built entirely on serverless infrastructure without a single stored secret.

Originally built in 2015 using HTML/CSS/JS, MySQL, and PHP, Last2Lines has hosted seven global campaigns and was recognised at the **New Media Writing Prize (UK)** — winning the **Social Good Prize (2024)** and earning Runner-up for the **Chris Meade Memorial Main Prize (2024)**. The codebase was fully re-architected using **Next.js 16**, **Vercel**, and **Amazon Aurora PostgreSQL**.

---

## Features

- **Concurrent campaigns** — Multiple simultaneous global campaigns, each with its own lifecycle (Draft → Active → Completed).
- **Frictionless contributions** — Public couplet submission with no account required; full client- and server-side validation.
- **AI moderation pipeline** — Three-verdict system (Publish / Curate / Manual Review) powered by AWS Bedrock (Amazon Nova Micro) via the Vercel AI Gateway. Fails safe to human review on any model error.
- **Email OTP verification** — Optional per-campaign spam mitigation via Resend; the plain code never touches the database (SHA-256 hash stored with 15-minute expiry).
- **Campaign partners** — Each campaign can list partner organisations, displayed publicly on the campaign page and managed from the admin form.
- **Admin dashboard** — Authenticated admins create campaigns, moderate the contribution queue, edit couplets, manage authors (search, filter by campaign/country, pagination, delete with cascade), configure per-campaign moderation settings, and review contact submissions.
- **Contact form** — Four-type dynamic form (New Campaign Request, Feedback, Concern, General) that persists submissions to the DB and dispatches a formatted HTML notification email to the admin inbox via Resend.
- **Contact submissions inbox** — Admin dashboard page with status tracking (new / read / archived), type filtering, pagination, detail dialog, and delete confirmation.
- **Interactive world map** — `/visualize` renders per-country contribution density with D3 and `react-simple-maps`.
- **Light / dark mode** — Theme-aware UI throughout via `next-themes`.
- **Accessible by default** — WCAG-compliant semantic HTML, visible focus rings, `aria-live` regions on all dynamic counters.

---

## Tech Stack

| Layer         | Technology                                                    |
| ------------- | ------------------------------------------------------------- |
| Framework     | Next.js 16 (App Router, React 19, Server Actions)             |
| Styling       | Tailwind CSS v4, shadcn/ui, lucide-react                      |
| Hosting       | Vercel (Fluid Compute, Edge Middleware, Analytics)            |
| Database      | Amazon Aurora PostgreSQL — IAM auth via `@aws-sdk/rds-signer` |
| Auth          | Supabase Auth (admin sessions, SSR cookies)                   |
| AI            | AWS Bedrock (Amazon Nova Micro) via Vercel AI Gateway         |
| Visualization | D3, react-simple-maps                                         |
| Email         | Resend (OTP verification, contact form admin notifications)   |
| Observability | Vercel Analytics, Speed Insights, OpenTelemetry               |
| Validation    | Zod                                                           |

---

## Architecture

```
                   ┌──────────────────────────────────────────────┐
                   │                   VERCEL                       │
                   │                                                │
 Browser  ──────►  │  Edge Middleware (Supabase session refresh)    │
 (visitors         │            │                                   │
  & admins)        │            ▼                                   │
                   │  Next.js 16 App Router (React 19)              │
                   │   • Server Components (read via lib/queries)   │
                   │   • Server Actions   (write via lib/actions)   │
                   │   • Fluid Compute functions                    │
                   │            │                 │                 │
                   │            │                 │ Vercel AI       │
                   └────────────┼─────────────────┼─Gateway─────────┘
                                │                  │
               IAM auth (OIDC)  │                  │  OIDC
                                ▼                  ▼
                   ┌────────────────────┐  ┌────────────────────┐
                   │  AWS Aurora Postgres│  │    AWS Bedrock     │
                   │  (all app data)    │  │ (Nova Micro)       │
                   └────────────────────┘  └────────────────────┘

                   ┌────────────────────┐  ┌────────────────────┐
 admin login ────► │   Supabase Auth    │  │      Resend        │
                   │ (sessions only)    │  │  (OTP + contact    │
                   └────────────────────┘  │   notifications)   │
                                           └────────────────────┘
```

### Key design decisions

**No stored cloud secrets.** Both Aurora PostgreSQL and AWS Bedrock are accessed using short-lived credentials derived at runtime from Vercel's OIDC identity. `@aws-sdk/rds-signer` generates a per-connection auth token; no database password exists anywhere.

**Fluid Compute** manages the connection pool across serverless invocations via `attachDatabasePool`, preventing connection exhaustion without idle resource waste.

**Fail-safe AI moderation.** Any parse failure, timeout, or model error returns `{ decision: 'manual', fallback: true }` — submissions are never auto-rejected or silently lost.

**Supabase Auth is admin-only.** All application data (campaigns, contributions, authors, contact submissions) lives in Aurora PostgreSQL. Supabase handles only admin identity — a clean separation of concerns.

---

## Data Model

### Tables

| Table                 | Purpose                                                           |
| --------------------- | ----------------------------------------------------------------- |
| `campaigns`           | Campaign metadata, status, AI settings, partners, dates           |
| `contributions`       | Submitted couplets, moderation status, `sequence_number`          |
| `authors`             | Contributors keyed by email; `active` / `banned` status           |
| `seed_couplets`       | Admin-authored opening lines shown before community couplets      |
| `moderation_settings` | Per-campaign AI moderation configuration (1-to-1 with campaigns)  |
| `email_otps`          | SHA-256 hashed OTP codes with 15-minute expiry                    |
| `contact_submissions` | Contact form submissions with type, status, and message body      |

### Relationships

| Child Table           | FK Column     | References      | On Delete   |
| --------------------- | ------------- | --------------- | ----------- |
| `contributions`       | `campaign_id` | `campaigns.id`  | CASCADE     |
| `contributions`       | `author_id`   | `authors.id`    | CASCADE     |
| `moderation_settings` | `campaign_id` | `campaigns.id`  | CASCADE     |
| `seed_couplets`       | `campaign_id` | `campaigns.id`  | CASCADE     |
| `email_otps`          | `campaign_id` | `campaigns.id`  | CASCADE     |
| `contact_submissions` | —             | —               | Standalone  |

`campaigns` is the root entity — deleting a campaign cascade-deletes all five dependent tables. `contact_submissions` is intentionally standalone so submissions survive campaign or author deletion.

### Indexes

| Table           | Index                        | Columns                                                   | Notes                                    |
| --------------- | ---------------------------- | --------------------------------------------------------- | ---------------------------------------- |
| `campaigns`     | `idx_campaigns_slug`         | `slug`                                                    | Fast public slug lookup                  |
| `campaigns`     | `idx_campaigns_status`       | `status`                                                  | Filter by lifecycle status               |
| `authors`       | `idx_authors_status`         | `status`                                                  | Filter active / banned                   |
| `contributions` | `idx_contributions_campaign` | `campaign_id`                                             | All contributions for a campaign         |
| `contributions` | `idx_contributions_author`   | `author_id`                                               | All contributions by an author           |
| `contributions` | `idx_contributions_status`   | `status`                                                  | Filter pending / approved / rejected     |
| `contributions` | `idx_contributions_poem`     | `(campaign_id, sequence_number)` WHERE `status='approved'`| **Partial index** — ordered poem render  |

The partial index `idx_contributions_poem` is the most performance-critical: it covers the primary public read path (rendering an ordered approved poem) while staying small by excluding pending and rejected rows.

---

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

### Environment Variables

| Variable                        | Purpose                                                        |
| ------------------------------- | -------------------------------------------------------------- |
| `PGHOST`                        | Aurora PostgreSQL cluster endpoint                             |
| `PGDATABASE`                    | Database name (defaults to `postgres`)                         |
| `PGUSER`                        | Database user (defaults to `postgres`)                         |
| `AWS_ROLE_ARN`                  | IAM role assumed via Vercel OIDC for DB + Bedrock              |
| `AWS_REGION`                    | AWS region for Aurora and Bedrock                              |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL (admin auth)                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (admin auth)                                 |
| `RESEND_API_KEY`                | Resend API key for OTP and contact notification emails         |
| `ADMIN_CONTACT_EMAIL`           | Inbox that receives contact form submission notifications      |

All variables are managed automatically in v0 / Vercel. Database access uses short-lived IAM auth tokens — no DB password is stored.

---

## Project Structure

```
app/
  page.tsx                        Homepage / campaign directory
  campaign/[slug]/                Public campaign page + poem
  visualize/                      Global contribution density map
  dashboard/
    campaigns/                    Campaign CRUD
    contributions/                Moderation queue
    authors/                      Author management (search, filter, paginate)
    contact/                      Contact submissions inbox
    settings/                     Admin settings
  auth/                           Supabase login, callback, error
  api/
    seed-campaigns/               Demo data seeding endpoint
    send-verification-email/      OTP dispatch
  about/ · contact/ · terms/ · flows/
components/
  admin/                          Dashboard-specific components
    campaign-form.tsx             Full campaign create/edit form
    contributions-table.tsx       Moderation queue table
    authors-table.tsx             Author list with search, filters, pagination
    contact-submissions-table.tsx Inbox with status tracking and delete
  ui/                             shadcn/ui primitives
  faq.tsx                         Grouped, filterable FAQ accordion
  how-it-works.tsx                Flow diagrams (contributors + partners)
  contact-form.tsx                4-type dynamic contact form
  site-header.tsx / site-footer.tsx
lib/
  db.ts                           Aurora PostgreSQL pool with IAM auth
  queries.ts                      Read queries (server-only)
  actions.ts                      Server Actions (mutations + auth)
  ai-moderation.ts                AWS Bedrock moderation pipeline
  mock-data.ts                    Campaign / Author TypeScript interfaces
  supabase/                       Supabase SSR client + session proxy
scripts/
  001-setup-schema.sql            Core tables + constraints
  002-email-otps.sql              OTP table
  002-seed-data.sql               Initial seed
  003-add-seed-couplets.sql       Seed couplets table
  003-add-campaign-partners.sql   Partners TEXT[] column
  004-schema-corrections.sql      Schema patches
  005-add-contact-submissions.sql Contact submissions table
  005-indexes.sql                 Performance indexes
middleware.ts                     Supabase session refresh on each request
```

---

## Request Flows

### Public couplet submission

1. Visitor submits from a campaign page (client-side validation: character limits, required fields, consent).
2. `submitContribution` Server Action re-validates and confirms the campaign is open.
3. If AI moderation is enabled, the couplet goes to AWS Bedrock:
   - **publish** → approved immediately with a sequence number.
   - **curate** → AI-rewritten lines, approved immediately.
   - **manual** → queued for human review.
4. Author is upserted by email; banned authors are blocked. Affected pages are revalidated.

### Admin moderation

1. Admin signs in via Supabase Auth; Edge Middleware refreshes the session cookie on every request.
2. Dashboard Server Components read pending contributions from Aurora via `lib/queries.ts`.
3. Approve / Reject / Re-queue actions run through `requireAdmin()` and write to Aurora, then revalidate public pages.

### Contact form submission

1. Visitor selects a form type (New Campaign, Feedback, Concern, General) and submits.
2. `submitContactForm` Server Action validates input, inserts the row into `contact_submissions`.
3. A formatted HTML notification email is dispatched to `ADMIN_CONTACT_EMAIL` via Resend (fire-and-forget; never blocks the user).
4. Admin reviews submissions in the Contact dashboard — can mark read, archive, or delete.

---

## Roadmap

- **Multi-language support** — Localised AI moderation prompts for non-English campaigns.
- **Contributor profiles** — Opt-in portfolio pages for repeat authors.
- **Campaign analytics** — Per-campaign submission velocity, verdict distribution, and geographic spread.
- **Scheduled campaigns** — Vercel Cron auto-transitions (`upcoming → active → completed`) at configured dates.
- **Webhook integrations** — Post approved couplets to social feeds, Slack channels, or a CMS.
- **Printed poetry exports** — Typeset PDF of a completed campaign's poem.

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [v0 Documentation](https://v0.app/docs)
- [use_cases.md](./use_cases.md) — full use cases and user flows
