# Last2Lines

## Elevator Pitch

A collaborative poetry platform where the world writes one poem, two lines at a time — powered by AI moderation and built entirely on serverless infrastructure without a single stored secret.

---

## Inspiration

Poetry has always been a communal art form. From oral traditions to collaborative manuscripts, the act of creating together has produced some of humanity's most resonant work. We were inspired by the idea that a single poem could grow across borders — that a student in Karachi, a teacher in São Paulo, and a retiree in Oslo could each add two lines to the same living verse without ever knowing each other existed. The constraint of exactly two lines — a couplet — is deliberate: it is enough to say something real, but not so much that any single voice dominates.

We also wanted to explore what it means to build a modern, production-grade web application using only managed, serverless infrastructure — no servers to maintain, no credentials to rotate, no DevOps overhead.

---

## What It Does

Last2Lines hosts campaigns — thematic poetry drives with a title, a premise, and an open/close window. Visitors browse active campaigns, read the growing poem, and submit their own two-line couplet. No account is needed.

Each submission passes through a three-tier AI moderation pipeline powered by AWS Bedrock (Amazon Nova Micro). The AI can publish a couplet directly, suggest a light editorial rewrite, or flag it for human review. Admins manage the full lifecycle — creating campaigns, moderating the queue, editing lines, banning abusive authors, and configuring per-campaign moderation sensitivity — through a password-protected dashboard.

The platform also features a live world map (`/visualize`) that renders per-country contribution density across all campaigns, built with D3 and `react-simple-maps`. Optional email verification (OTP via Resend) can be toggled per campaign to reduce spam, and admins can configure automatic publish-confirmation emails to contributors when their couplet goes live.

**Core capabilities at a glance:**

- Campaign creation and lifecycle management (draft → active → completed → archived)
- Public couplet submission — zero login, zero friction
- Three-verdict AI moderation: publish, curate (AI-rewrite), or flag for human review
- Admin moderation queue with approve / reject / re-queue and inline text editing
- Author management with ban/unban enforcement
- Per-campaign moderation settings (level, profanity filter, confidence threshold)
- Email OTP verification per campaign
- Automatic publish-confirmation email to contributors
- Interactive global contributions map
- Vercel Blob image storage for campaign backgrounds
- Fully responsive, accessible, dark/light-mode UI

---

## How I Built It

The application is a **Next.js 16 App Router** project written in TypeScript, deployed on Vercel. The entire data and AI layer runs on AWS, accessed without any long-lived credentials.

**Frontend:** React 19 Server Components handle all data reads. Server Actions handle every mutation. The client layer is minimal — form state, optimistic list updates, and chart interactions. Tailwind CSS v4 and shadcn/ui components provide the design system. Charts use Recharts; the world map uses `react-simple-maps` with D3 for projections and choropleth shading.

**Database:** AWS RDS for PostgreSQL. The schema has five tables: `campaigns`, `contributions`, `authors`, `moderation_settings`, and `email_otps`. Authentication to RDS uses IAM database authentication — `@aws-sdk/rds-signer` generates a short-lived token per connection. No database password is stored anywhere.

**AI Moderation:** AWS Bedrock (Amazon Nova Micro) is reached through the Vercel AI Gateway using the AI SDK. The gateway handles OIDC token exchange automatically, so no Bedrock API key or provider SDK is wired into the app. Zod schemas enforce structured output from the model.

**Auth:** Supabase Auth handles admin sessions (email + password). Edge Middleware refreshes the session cookie on every protected request. Public contribution submission requires no authentication.

**Email:** Resend sends OTP verification emails and publish-confirmation emails. The OTP flow stores a SHA-256 hash of the 6-digit code — the plain code never touches the database.

**Observability:** Vercel Analytics, Vercel Speed Insights, and OpenTelemetry (`@vercel/otel`) are wired in for performance and usage visibility.

---

### Why Vercel

Vercel was the natural deployment target for three concrete reasons:

1. **Fluid Compute** meant the database connection pool integrates correctly across serverless invocations — no connection exhaustion, no idle resource waste. The `attachDatabasePool` API handles this automatically.
2. **The AI Gateway** gave us zero-config access to AWS Bedrock using Vercel's OIDC identity, eliminating an entire category of credential management. We did not need to install or configure a Bedrock provider SDK — a model string was enough.
3. **Edge Middleware** let us refresh Supabase admin sessions on every protected request in a single, shared location, with no per-page boilerplate and no cold-start penalty for static pages (which bypass the middleware matcher entirely).

Vercel also provides Blob storage for campaign images, Analytics, and Speed Insights — all without any additional infrastructure decisions.

---

### Why AWS RDS

We needed a relational database with strict consistency, foreign-key constraints, and support for complex queries (aggregates, cursor pagination, partial indexes). RDS for PostgreSQL satisfied all of those requirements and added two capabilities that were architecturally important:

1. **IAM database authentication** — the database accepts a short-lived token generated by `@aws-sdk/rds-signer` using the application's IAM role. There is no static password. If credentials are ever rotated, there is nothing to rotate in the app.
2. **Native compatibility with the Vercel OIDC flow** — the same `awsCredentialsProvider` from `@vercel/functions/oidc` that signs the RDS token also signs requests to AWS Bedrock. One IAM role, two AWS services, zero stored secrets.

RDS Proxy was identified as the recommended production multiplexing layer given the serverless connection-per-invocation model.

---

### Why v0

v0 was used to design and scaffold the entire user interface — campaign cards, the submission form with live character counters and validation states, the admin dashboard tables, the world map layout, and the dark/light-mode design system. It accelerated the UI layer from wireframe to production-quality components in a fraction of the time it would take to hand-author, and it kept the design consistent and accessible (WCAG-compliant semantic HTML, ARIA attributes, visible focus rings) without requiring a dedicated design pass.

---

## Challenges I Ran Into

**IAM credential bootstrap latency.** The first connection to RDS in a cold serverless invocation requires an OIDC token exchange, an IAM role assumption, an RDS auth token generation, a TLS handshake, and a connection pool warmup — all before the first SQL query runs. This added 3–8 seconds to cold starts. We mitigated this with a generous `connectionTimeoutMillis` (30 seconds), a `withRetry` wrapper that retries on transient connection errors, and an `isRetryable` classifier that safely identifies errors worth retrying without masking real application bugs.

**Structured AI output reliability.** Getting a consistent, machine-parseable verdict from Amazon Nova Micro — especially for edge-case couplets that straddle moderation thresholds — required careful prompt engineering. The system prompt had to establish a clear editorial identity, specify precise decision rules for each verdict tier, and account for the three sensitivity levels (lenient / standard / strict). We also had to make the entire pipeline fail-safe: any parse failure, timeout, or model error falls back to `manual` (human review), never to auto-approval or auto-rejection.

**OTP security without over-engineering.** The email OTP flow needed to be secure without adding external state (Redis, a separate auth service). We solved it with: SHA-256 hashing of the code at rest, a 15-minute expiry stored in the `email_otps` table, a partial index on `(email, campaign_id, expires_at) WHERE used = false` to make lookups fast and only over active tokens, and immediate invalidation of any prior unused OTP for the same pair when a new one is requested.

**Sequence number consistency under concurrency.** Approved contributions must be assigned an incrementing `sequence_number` within a campaign. Two simultaneous approvals could race and produce duplicate sequence numbers. We handled this with a `SELECT MAX(sequence_number) + 1` inside the same transaction that writes the approval, relying on RDS's serialization guarantees for the common case, with the understanding that a unique constraint or advisory lock would be the production-hardening step.

---

## Accomplishments That I Am Proud Of

**Zero stored cloud secrets.** The application connects to AWS RDS and AWS Bedrock using only short-lived credentials derived at runtime from Vercel's OIDC identity. No AWS access keys appear in any environment variable, configuration file, or secret store.

**A genuinely useful AI moderation model.** The three-verdict pipeline — publish, curate, manual — is meaningfully better than a binary approve/reject. It allows the AI to lightly edit a good-faith submission that has a minor issue, rather than forcing it into the human queue or discarding it. The fail-safe fallback means no valid submission is ever silently lost due to an infrastructure fault.

**Production-grade database design.** The schema uses partial indexes (`idx_contributions_poem`, `idx_email_otps_active`) to keep index size minimal while keeping the most critical query paths fast. Foreign keys with `ON DELETE CASCADE` maintain referential integrity at the database level. Parameterized SQL is used everywhere.

**An accessible, coherent design system.** The UI is fully keyboard-navigable, uses semantic HTML throughout, and supports dark and light modes. Live character counters, inline validation states, and loading spinners are present on every interactive form — not as afterthoughts, but as first-class interface behaviors.

---

## What I Learned

- **OIDC is the right model for serverless-to-cloud trust.** Storing credentials is a liability that compounds over time. Federating trust through short-lived tokens derived from the deployment platform's identity is simpler, more secure, and easier to audit.
- **Fail-safe defaults matter more than happy-path performance.** Making the AI moderation pipeline return a safe fallback on any error — rather than propagating exceptions — was a decision that improved the system's reliability more than any optimization we made to the happy path.
- **Next.js Server Actions are a better form boundary than REST endpoints.** Server Actions colocate the mutation logic with the page that triggers it, give you direct access to `revalidatePath`, and eliminate the round-trip overhead of a separate API layer for the vast majority of mutations.
- **Partial indexes are underused.** The poem-fetch query — which filters to `status = 'approved'` and orders by `sequence_number DESC` — runs against a partial index that physically excludes all pending and rejected rows. The practical query performance difference on a large `contributions` table is significant.

---

## What's Next for Last2Lines

**Multi-language support.** The platform currently has no language constraint on submissions. A future version would support per-campaign language configuration and localized AI moderation prompts, enabling campaigns in Arabic, Urdu, Spanish, or French with the same moderation quality as English.

**Public contributor profiles.** Right now, authors are identified by email and stored anonymously. A lightweight opt-in profile page would let repeat contributors build a visible portfolio of their published couplets across campaigns.

**Campaign analytics dashboard.** Admins see aggregate stats but not behavioral data — submission velocity over time, moderation verdict distribution, geographic contribution spread per campaign. A per-campaign analytics view would help campaign organizers understand engagement and tune their moderation settings.

**Scheduled campaigns and auto-close.** Campaigns currently require manual status changes. A cron-based job (Vercel Cron or a workflow) that automatically transitions campaigns from `upcoming` to `active` at `start_date` and from `active` to `completed` at `close_date` would remove operational overhead.

**Webhook integrations.** Triggering external actions on moderation events — posting a newly approved couplet to a social feed, notifying a Slack channel, syncing to a CMS — would make Last2Lines a composable component in a larger content workflow rather than a standalone platform.

**Printed poetry exports.** Generating a beautifully typeset PDF of a completed campaign's poem — ready for print or sharing — would give campaigns a natural, shareable artifact at close.
