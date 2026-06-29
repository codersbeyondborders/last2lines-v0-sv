# Last2Lines 2.0 — Hackathon Submission

> **An AI-powered global advocacy platform where the world writes a single poem, two lines at a time.**

---

## Table of Contents

1. [Introduction](#introduction)
2. [How I Re-Built It](#how-i-re-built-it)
3. [Inspiration & Background](#inspiration--background)
4. [What It Does](#what-it-does)
5. [Architecture & Implementation](#architecture--implementation)
6. [Application Flows](#application-flows)
7. [Why Vercel](#why-vercel)
8. [Why Amazon Aurora PostgreSQL](#why-amazon-aurora-postgresql)
9. [Why v0](#why-v0)
10. [Challenges](#challenges)
11. [Accomplishments](#accomplishments)
12. [What I Learned](#what-i-learned)
13. [What's Next](#whats-next)
14. [Before & After](#before--after)

---

## Introduction

**Last2Lines** is an AI-powered social campaigning platform built on a deceptively simple premise: the world writes a single poem, two lines at a time. Partner NGOs and advocacy organizations launch thematic campaigns — climate change, human rights, digital inclusion — and contributors from every corner of the globe each add a single couplet to a shared, ever-growing poem. The result is not a petition with thousands of identical signatures, but a living, diverse narrative: a collective creative act that carries the weight of every individual voice while reading as a unified work of art. For this hackathon, that vision has been completely re-engineered into **Last2Lines 2.0** — a production-ready, globally scalable platform worthy of the mission it serves.

The problem with the original platform was architectural debt. Built in 2015 as a proof of concept using PHP and MySQL, the site worked well enough to win the **Social Good Prize** and **First Place for the Chris Meade Memorial Main Prize** at the **New Media Writing Prize (UK)** in 2024 — international validation that the concept was genuinely resonating. But behind the accolades, the platform was operating on borrowed time: it could only run one campaign at a time, had no email verification, no accessibility standards, no observability, and no capacity to handle the kind of concurrent global traffic a viral campaign would generate. Every new feature request required archaeological-level PHP editing. The technology was becoming the ceiling of the mission.

The hackathon became the catalyst for a full re-architecture. The goal was not simply to port the old site to a newer stack, but to rebuild it as the platform it always needed to be — one that could run multiple concurrent campaigns simultaneously, moderate contributions intelligently without creating a bottleneck for admins, verify authors without creating friction for contributors, and reach any device, in any language, at any scale. To achieve that transformation in a single weekend required making bold, deliberate technology choices rather than incremental improvements: **Vercel** for deployment intelligence, **AWS Aurora PostgreSQL** for a zero-trust relational data foundation, **AWS Bedrock** for AI-assisted content moderation, and **v0** to scaffold a production-quality, accessible UI at a pace that would otherwise have been impossible.

The result is Last2Lines 2.0 — a serverless, TypeScript-first application where **zero long-lived credentials exist anywhere in the codebase**, where every submission is evaluated by a fail-safe three-verdict AI pipeline before a human ever sees it, and where the entire infrastructure scales from zero to global without a single server to manage. It is a platform that respects both its contributors — with a frictionless, barrier-free participation model — and its operators — with the observability, security, and administrative control required to steward a global creative community responsibly. What was once a rigid legacy prototype is now an enterprise-grade platform built to last the next decade.

---

## How I Re-Built It

I started with a 10-year-old PHP + MySQL monolith and — over a single weekend — systematically dismantled and replaced every layer: **v0** scaffolded the entire frontend, generating WCAG-compliant, dark/light-mode-aware React components at a pace that would have taken weeks manually; **Next.js 16 App Router** replaced the legacy PHP routing with React Server Components for reads and Server Actions for every mutation, eliminating a separate API layer entirely; **AWS Aurora PostgreSQL** with IAM database authentication replaced the MySQL backend, trading static passwords for short-lived cryptographic tokens generated per connection via `@aws-sdk/rds-signer`, with **RDS Proxy** handling the connection multiplexing inherent to serverless; and **AWS Bedrock (Amazon Nova Micro)**, routed through the **Vercel AI Gateway** using OIDC federation, replaced manual human-only moderation with a three-verdict AI pipeline — all without a single stored credential. The result is one unified IAM role authenticating two AWS services and zero secrets anywhere in the codebase, deployed on Vercel with Fluid Compute, ISR, Edge Middleware session management, and OpenTelemetry tracing — a production-hardened, globally scalable platform built from a legacy prototype in 48 hours.

---

## Inspiration & Background

Poetry has always been a communal art form. As an advocate for **ICT4D (Information and Communications Technology for Development)**, I created [Last2Lines.com](http://last2lines.com) because collaborative poetry can serve as a powerful, borderless alternative to geographically-bound awareness campaigns.

Originally built in **2015** using HTML, CSS, JS, MySQL, and PHP, the platform has successfully hosted seven global campaigns. In 2024, the project won the **Social Good Prize** and took **First Place for the Chris Meade Memorial Main Prize** at the **New Media Writing Prize (UK)** — validating its mission at an international level.

However, the legacy architecture had critical limitations:

- Single campaign at a time — no concurrency
- No modern accessibility standards or clean UI
- No third-party integrations (email, AI, analytics)
- No observability, performance tooling, or scalability for a global user base

### The Hackathon Transformation

This submission transforms Last2Lines from that rigid legacy site into a highly scalable, production-grade platform by leveraging **Vercel** and **AWS** to engineer features that were previously impossible:

| Legacy | Last2Lines 2.0 |
|---|---|
| Single campaign | Concurrent campaigns |
| Manual moderation | AWS Bedrock AI pipeline |
| No analytics | Vercel Analytics + OpenTelemetry |
| PHP + MySQL | Next.js 16 + Aurora PostgreSQL |
| No email | Resend + OTP verification |
| No accessibility | WCAG-compliant design system |

---

## What It Does

Last2Lines 2.0 transforms digital advocacy by turning traditional petitions into collaborative art. Partner NGOs launch thematic campaigns (e.g., *Climate Change Awareness*) where contributors worldwide write a single, evolving poem together — two lines at a time. The final result is a living, diverse narrative that serves as a creative "signature campaign."

### The Campaign Lifecycle

1. **Initiation** — A partnering NGO provides campaign assets: title, tagline, rules, banner image, and optional donation/video links.
2. **Deployment** — An Admin creates the campaign on the platform, instantly generating a unique public URL.
3. **Participation** — Visitors browse active campaigns, read the growing poem, and submit their two-line couplet. **Zero logins. Zero friction.**
4. **AI Moderation** — Every couplet is routed through the AWS Bedrock pipeline for automated verdict assignment.
5. **Re-engagement** — Once published, contributors receive an automated email with their couplet plus the NGO's donation and educational links.

### Intelligent AI Moderation Pipeline

Every submission passes through an **AWS Bedrock (Amazon Nova Micro)** moderation pipeline that issues one of three verdicts:

| Verdict | Action |
|---|---|
| ✅ **Publish** | Automatically approves safe, on-topic content |
| ✏️ **Curate** | Suggests a light AI-assisted editorial rewrite to improve flow |
| 🚩 **Flag** | Routes ambiguous or sensitive content to the human review queue |

Admins control this entire lifecycle from a secure dashboard: editing lines, banning abusive authors, and configuring per-campaign AI sensitivity (profanity filters, confidence thresholds). The pipeline is **strictly fail-safe** — any parsing failure, timeout, or API error automatically defaults to human review. No valid contribution is ever silently lost; no harmful content is ever auto-approved.

### Core Capabilities at a Glance

- **End-to-End Campaign Management** — Full lifecycle: Draft → Active → Completed → Archived
- **Zero-Friction Submissions** — Public contributions without user accounts
- **Three-Verdict AI Pipeline** — Publish, AI-Rewrite, or Flag, with adjustable per-campaign sensitivity
- **Comprehensive Admin Dashboard** — Moderation queue (approve/reject/re-queue), inline text editing, author bans
- **Interactive Global Map** — Real-time D3 + react-simple-maps choropleth of worldwide contributions
- **Campaign Security** — Per-campaign toggleable email OTP (SHA-256 hashed, never stored in plain text)
- **Automated Re-engagement** — Triggered confirmation emails with NGO promotion links via Resend
- **Scalable Asset Storage** — Vercel Blob for campaign banner image management
- **Inclusive Design** — Fully responsive, WCAG-compliant, dark/light mode UI

---

## Architecture & Implementation

The application is engineered as a serverless **Next.js 16 (App Router)** project written in TypeScript, deployed on Vercel, with the entire data and AI layer running securely on AWS — operating **entirely without long-lived credentials**.

### Architecture Diagram

![Architecture Diagram](https://c4rbre3st1qsrhc9.public.blob.vercel-storage.com/Architecture-Diagram.png)
*Figure 1: Last2Lines 2.0 — Vercel + AWS Architecture*

---

### Frontend & UI Layer

The architecture leverages **React Server Components** for all data reads and **Server Actions** for every mutation. The client layer is kept intentionally minimal — responsible only for form state, optimistic updates, and interactive chart rendering.

- **Design System:** Tailwind CSS v4 + shadcn/ui — strict accessibility and responsive dark/light mode
- **Data Visualization:** Recharts for analytics, react-simple-maps + D3 for the global contribution map
- **Performance:** Streaming SSR renders the page shell instantly while data fetches server-side

---

### Data Foundation — AWS Aurora PostgreSQL

The application is backed by **Amazon Aurora PostgreSQL**. The schema consists of five core tables:

```
campaigns → contributions → authors
         → moderation_settings
         → email_otps
```

**Security Architecture:**
- Authentication uses **AWS IAM database authentication** — `@aws-sdk/rds-signer` generates short-lived cryptographic tokens per connection
- **Zero static database passwords** are stored anywhere in the application
- All queries use parameterized inputs (`$1`, `$2`) — zero raw concatenation

**Serverless Connection Management:**
- **RDS Proxy** multiplexes traffic safely in a connection-per-invocation serverless model
- Connections capped at `max: 5` per function instance to protect `db.t3.medium` compute limits
- `connectionTimeoutMillis: 30s` accounts for cold-start IAM + TLS handshake latency (3–8 seconds)
- `idleTimeoutMillis: 60s` preserves active connections across rapid requests
- Custom `withRetry` wrapper with an `isRetryable` classifier handles transient cold-start errors safely

**Database Integrity Optimizations:**
- `ON DELETE CASCADE` across contributions, moderation_settings, and email_otps tables
- Partial indexes (`idx_contributions_poem`, `idx_email_otps_active`) filter dead rows, minimizing disk footprints and maximizing query speed

---

### AI Moderation Pipeline — AWS Bedrock via Vercel AI Gateway

Requests to **AWS Bedrock (Amazon Nova Micro)** are routed through the **Vercel AI Gateway** using the AI SDK. This architectural decision eliminates an entire category of credential management:

- The gateway handles the **OIDC token exchange automatically** — no Bedrock API keys, no provider SDKs
- The same `awsCredentialsProvider` (via `@vercel/functions/oidc`) that signs Aurora tokens also signs Bedrock requests
- **One IAM role. Two AWS services. Zero stored secrets.**
- **Zod schemas** strictly enforce structured, predictable model outputs for the three-verdict system

---

### Authentication & Security

| Layer | Mechanism |
|---|---|
| Admin Sessions | Supabase Auth (email + password) |
| Session Refresh | Vercel Edge Middleware on every protected route |
| Public Submissions | Zero authentication — frictionless by design |
| Spam Mitigation | Per-campaign email OTP via Resend |
| OTP Storage | SHA-256 hash only — plain-text codes never touch the database |

---

### Observability & Telemetry

The application is deeply instrumented for production-grade reliability:

- **Vercel Analytics** — Traffic patterns, conversion funnels, campaign engagement
- **Vercel Speed Insights** — Core Web Vitals (LCP, INP, CLS) measured in production
- **OpenTelemetry (`@vercel/otel`)** — Cross-service tracing to Supabase and Resend, detecting slow queries and bottlenecks directly in the Vercel dashboard

---

## Application Flows

### Overall Step-by-Step Flow

![Step by Step Flow](https://c4rbre3st1qsrhc9.public.blob.vercel-storage.com/step-by-step-flow.png)
*Figure 2: End-to-End Application Flow*

---

### Flow 1: User Contribution Journey

![User Flow](https://c4rbre3st1qsrhc9.public.blob.vercel-storage.com/flow1.png)
*Figure 3: User Flow — Discovery to Published Couplet*

---

### Flow 2: Email OTP Verification

![Email Verification Flow](https://c4rbre3st1qsrhc9.public.blob.vercel-storage.com/flow2.png)
*Figure 4: Optional Per-Campaign Email OTP Verification*

---

### Flow 3: AI Moderation Pipeline

![AI Moderation Flow](https://c4rbre3st1qsrhc9.public.blob.vercel-storage.com/flow3.png)
*Figure 5: AWS Bedrock Three-Verdict AI Moderation Pipeline*

---

### Flow 4: Admin Manual Moderation

![Admin Moderation Flow](https://c4rbre3st1qsrhc9.public.blob.vercel-storage.com/flow4.png)
*Figure 6: Admin Dashboard — Human Review Queue*

---

### Flow 5: Campaign Creation

![Campaign Creation Flow](https://c4rbre3st1qsrhc9.public.blob.vercel-storage.com/flow6.png)
*Figure 7: Admin Campaign Creation Lifecycle*

---

## Why Vercel

Vercel was the natural deployment target, providing three critical architectural advantages out of the box that directly shaped the application design:

### 1. Zero-Config AI Gateway (AWS Bedrock)

The AI Gateway gave direct access to AWS Bedrock via Vercel's OIDC identity. No Bedrock SDK to configure, no API keys to store — a single model string was sufficient. This eliminated an entire credential management category.

### 2. Optimized Serverless Database Connections

**Fluid Compute** and **Database Connection Pooling** (`attachDatabasePool`) efficiently manage connection lifecycles across serverless invocations, preventing connection exhaustion under traffic spikes without idle resource waste.

### 3. Edge-Optimized Authentication

**Edge Middleware** refreshes Supabase admin sessions on every protected request in a single shared location — zero per-page boilerplate. It also bypasses Supabase checks entirely on public pages, eliminating latency on high-traffic campaign URLs.

### Beyond the Core: Vercel's Ecosystem Advantages

**Performance & Caching:**
- **Streaming SSR** — Renders page shell instantly, reducing TTFB
- **ISR (Incremental Static Regeneration)** — Shields the Aurora backend from traffic spikes; serves cached responses while fetching new data on schedule
- **Image Optimization** — Per-device/browser optimized images via Vercel Blob; reduces bandwidth on hero imagery
- **Cache-Control Headers** — Prevents CDN/browser caching of transactional responses (auth, OTP, email)

**Reliability & Security:**
- **Fluid Compute (`maxDuration`)** — Prevents cold-start timeouts on file uploads and DB migrations
- **Skew Protection** — Pins static assets to the exact deployment, preventing JS chunk mismatches for users on stale pages
- **SSL for AWS RDS** — Encrypts all data in transit to AWS

**Marketing & Observability:**
- **Native OG Image Generation** — Rich social previews when campaigns are shared on Twitter/LinkedIn
- **`@vercel/otel`** — Cross-service traces to Supabase and Resend in the Vercel dashboard
- **Speed Insights** — Catches Web Vital regressions before users report them
- **Web Analytics** — Identifies which campaigns drive the most traffic and conversion

---

## Why Amazon Aurora PostgreSQL

Last2Lines required strict relational consistency, foreign-key enforcement, and complex querying (aggregates, cursor pagination, partial indexing). Aurora PostgreSQL satisfied these requirements while unlocking two capabilities critical to the serverless architecture:

### Zero-Trust IAM Authentication

Aurora's native IAM database authentication integrates directly with the Vercel OIDC flow. The `@aws-sdk/rds-signer` generates short-lived cryptographic tokens using the application's IAM role (`AWS_ROLE_ARN`). There is **no static database password anywhere** in the application. The same OIDC provider credential that authenticates Aurora also authenticates Bedrock — one IAM role, two AWS services, zero secrets.

### Serverless-Native Scaling

The RDS Proxy infrastructure safely multiplexes connection spikes inherent to serverless architectures. Combined with connection caps, retry policies, and Fluid Compute lifecycle management, the database layer is purpose-built for a connection-per-invocation model at any scale.

---

## Why v0

Speed is critical during a weekend hackathon. But as an advocate for disability and inclusive design, rigorous accessibility was equally non-negotiable. **v0 bridged both goals simultaneously.**

v0 was used to rapidly scaffold production-quality components across the entire platform:

- **User-Facing UI** — Campaign cards, frictionless submission forms with live character counters and real-time validation states
- **Data Visualization** — The interactive global contributions map layout structure
- **Admin Dashboard** — Comprehensive data tables, moderation queues, and inline editing controls
- **Design System** — A flawlessly implemented, system-aware dark/light mode toggle maintaining high-contrast readability in both states

Beyond speed, v0 **natively enforced accessibility**. It automatically generated WCAG-compliant semantic HTML, correctly mapped ARIA attributes, and implemented visible focus rings — ensuring Last2Lines could serve a diverse global audience from day one, without a separate accessibility audit.

> *I quickly exhausted the initial v0 credit allocation and purchased additional credits twice. My goal was to engineer an enterprise-grade application over the weekend — and v0 was the exact catalyst needed to achieve that quality.*

---

## Challenges

### I. IAM Credential Bootstrap Latency

Operating without long-lived credentials is secure, but cold serverless invocations introduce a complex initialization sequence: OIDC token exchange → IAM role assumption → RDS auth token generation → TLS handshake → connection pool warmup → first SQL query. This added **3–8 seconds to cold starts**.

**Solution:** A generous `connectionTimeoutMillis` (30 seconds) paired with a custom `withRetry` wrapper and an `isRetryable` classifier. The system safely identifies and retries transient connection errors during cold starts without masking genuine application bugs.

### II. Structured AI Output Reliability

Extracting consistent, machine-parseable verdicts from Amazon Nova Micro for nuanced edge-case poetry — content that straddles moderation thresholds — required rigorous, iterative prompt engineering.

**Solution:** A system prompt that establishes a strict editorial identity, defines precise decision rules for all three verdict tiers, and dynamically accounts for per-campaign sensitivity levels (lenient, standard, strict). The entire pipeline defaults to the **human review queue on any error** — no exceptions propagate, no content is silently lost.

---

## Accomplishments

**Modernized Architecture & Scalability**
Successfully rebuilt a 10-year-old PHP application into a serverless, accessible, enterprise-grade platform in a single weekend — with production-ready observability, multi-campaign concurrency, and global scalability.

**Context-Aware AI Moderation**
Engineered a three-verdict pipeline significantly more nuanced than binary approval systems. The "Curate" verdict — where the AI lightly edits good-faith submissions — maintains content quality while reducing administrative overhead. Strictly fail-safe by design.

**Production-Grade Data Integrity**
Partial indexes (`idx_contributions_poem`, `idx_email_otps_active`) maintain fast query speeds with minimal disk footprint. Referential integrity enforced via `ON DELETE CASCADE`. Zero-trust security maintained exclusively through parameterized queries and IAM token authentication.

**Inclusive, First-Class Design System**
Accessibility as a core feature — not an afterthought. Fully keyboard-navigable, semantic HTML throughout, native dark/light mode, real-time character counters, live inline validation, and intuitive loading states. A frictionless experience for a diverse, global audience.

---

## What I Learned

**End-to-End Vercel + AWS Architecture**
Gained deep, practical understanding of the entire Vercel ecosystem — how v0 accelerates UI scaffolding, how the AI Gateway bridges Vercel and AWS, and how Fluid Compute, ISR, and Edge Middleware work together as a cohesive production system.

**OIDC is the Superior Model for Serverless Trust**
Short-lived, federated tokens derived from the deployment platform's identity are not only more secure and auditable than stored credentials — they are fundamentally simpler to maintain. This is the zero-trust model for serverless cloud architecture.

**Fail-Safe Architecture Over Happy-Path Optimization**
Ensuring the AI pipeline defaults to a safe fallback on any error improved system reliability more than any individual performance optimization. Build the failure path first.

**Next.js Server Actions as an Architectural Boundary**
Server Actions outperform traditional REST endpoints for internal mutations. Colocation with the triggering page, direct `revalidatePath` access, and elimination of API boilerplate made them the dominant mutation pattern throughout the application.

---

## What's Next

- **Multi-language Support** — Per-campaign language configurations and localized AI moderation prompts
- **Public Contributor Portfolios** — Opt-in profiles showcasing published work across campaigns
- **Granular Campaign Analytics** — Submission velocity, verdict distribution, and geographic contribution dashboards for NGO organizers
- **Automated Campaign Lifecycle** — Vercel Cron jobs to automate Draft → Active → Completed transitions
- **Composable Webhook Integrations** — Post approved couplets to social feeds, Slack channels, or a CMS
- **Print-Ready Artifacts** — Beautifully typeset PDFs of completed poems
- **Generative Banner Images** — AI-generated campaign artwork to streamline NGO onboarding
- **Agentic Admin Flow** — AI agents handling heavy-lifting admin tasks with human-in-the-loop oversight
- **SaaS Transition** — Subscription model to sustain infrastructure and support social advocacy at scale

---

## Before & After

### Before — Legacy Last2Lines

![Before](https://c4rbre3st1qsrhc9.public.blob.vercel-storage.com/l2l_before.png)
*Figure 8: Last2Lines before the Vercel + AWS transformation*

The legacy platform was a rigid, PHP-based application — a single campaign at a time, no accessibility standards, no observability, no third-party integrations, and no scalability for a global audience.

---

### After — Last2Lines 2.0

![After](https://c4rbre3st1qsrhc9.public.blob.vercel-storage.com/l2l_after.png)
*Figure 9: Last2Lines 2.0 — production-hardened on Vercel + AWS*

Last2Lines 2.0 is a **production-hardened, Vercel-optimized stack** that:

- Shields the AWS backend from traffic spikes via **ISR and edge caching**
- Ensures rich social shareability via native **OG image generation**
- Provides comprehensive cross-service **error tracing with OpenTelemetry**
- Supports **auto-scaling serverless functions** with Fluid Compute
- Prevents deployment conflicts via **Skew Protection**
- Measures real user experience with **Core Web Vitals** in production
- Maintains security via efficient **connection pooling** and precise **cache-control headers**

This architecture is designed to scale from **100 to 100,000 concurrent users** without requiring further fundamental changes.

---

*Built with [Vercel](https://vercel.com) · [v0](https://v0.dev) · [AWS Aurora PostgreSQL](https://aws.amazon.com/rds/aurora/) · [AWS Bedrock](https://aws.amazon.com/bedrock/) · [Next.js 16](https://nextjs.org)*
