# Last2Lines: Collaborative Advocacy at Scale

Last2Lines is an AI-powered social campaigning platform where the world writes a single poem, two lines at a time, on a chosen subject. Built as an initiative to drive digital advocacy, the platform transforms traditional, geographically-bound social campaigns into borderless, collaborative art.

Built with [Next.js](https://nextjs.org) and [v0](https://v0.app), deployed on [Vercel](https://vercel.com) with an [Amazon Aurora PostgreSQL](https://aws.amazon.com/rds/aurora/) data layer.

## Project Evolution

Originally built in 2015 using HTML, CSS, JS, MySQL, and PHP, Last2Lines has hosted seven global campaigns. The project's impact was validated through its recognition at the **New Media Writing Prize (UK)**, where it won the **Social Good Prize (2024)** and earned Runner-up for the **Chris Meade Memorial Main Prize (2024)**.

To move from a manual, single-campaign legacy site to a production-ready, enterprise-grade platform, the project was completely re-architected during this hackathon using **Vercel** and **Amazon Aurora PostgreSQL**.

[Continue working on v0 →](https://v0.app/chat/projects/prj_momYygRFatvYncyFUR9WEJ8Bg2kU)

---

## Key Features

- **Concurrent Campaigns** — Unlike the legacy version, the new architecture supports multiple simultaneous global campaigns.
- **Public contributions** — Browse active campaigns and contribute a two-line couplet with no account required. Full client- and server-side validation (character limits, required fields, consent).
- **Intelligent Moderation** — A three-verdict pipeline (Publish / Curate / Manual Review) powered by AWS Bedrock (Amazon Nova Micro) via the Vercel AI Gateway, with a fail-safe that defaults to human review on any model error.
- **Interactive Visualization** — A real-time global map (`/visualize`) built with D3 and `react-simple-maps` displaying contribution density by country.
- **Frictionless UX** — Zero-login contributions with optional email verification (OTP via Resend) to mitigate spam.
- **Automated Lifecycle** — Admin-controlled campaign states (Draft → Active → Completed) with automated contributor confirmation emails.
- **Admin Dashboard** — Authenticated admins manage campaigns, moderate the contribution queue, edit couplets, and ban authors.
- **Light/dark mode** — Theme-aware UI throughout, powered by `next-themes`.

---

## Tech Stack

| Layer           | Technology                                                     |
| --------------- | -------------------------------------------------------------- |
| Framework       | Next.js 16 (App Router, React 19, Server Actions)              |
| Styling         | Tailwind CSS v4, shadcn/ui, lucide-react icons                 |
| Hosting         | Vercel (Fluid Compute, Edge Middleware, Analytics)             |
| Database        | Amazon Aurora PostgreSQL — IAM auth via `@aws-sdk/rds-signer`  |
| Auth            | Supabase Auth (admin sessions, SSR cookies)                    |
| AI              | AWS Bedrock (Amazon Nova Micro) via Vercel AI Gateway          |
| Visualization   | D3, react-simple-maps                                          |
| Email           | Resend (OTP verification, contributor confirmations)           |
| Observability   | Vercel Analytics, Speed Insights, OpenTelemetry                |
| Validation      | Zod                                                            |

For a deeper explanation of how these pieces fit together, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## Architecture

The application is a **Next.js 16 (App Router)** project written in **TypeScript**.

- **Frontend**: Built with **Tailwind CSS v4** and **shadcn/ui**. UI scaffolding was accelerated using **v0**, ensuring WCAG-compliant semantic HTML and high accessibility.
- **Database**: Leverages **Amazon Aurora PostgreSQL**. Security is handled via **IAM database authentication** — no passwords are stored, as tokens are generated per connection via `@aws-sdk/rds-signer`.
- **AI Moderation**: Powered by **AWS Bedrock (Amazon Nova Micro)**, orchestrated through the **Vercel AI Gateway**.
- **Authentication**: **Supabase Auth** secures admin sessions, with **Vercel Edge Middleware** handling cookie refreshing.
- **Observability**: Fully instrumented with **Vercel Analytics**, **Speed Insights**, and **OpenTelemetry**.

### Why Vercel & AWS

- **Fluid Compute** — Efficiently manages connection pooling across serverless invocations, preventing connection exhaustion.
- **Zero-Config Security** — OIDC-based identity federation allows one IAM role to access both Aurora PostgreSQL and AWS Bedrock without long-lived credentials.
- **Performance** — Employs **Streaming SSR**, **Incremental Static Regeneration (ISR)**, and **Edge Caching** to shield the backend from traffic spikes.

---

## Getting Started

Install dependencies and run the development server:

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment Variables

The app expects the following variables (managed automatically in v0/Vercel):

| Variable                        | Purpose                                          |
| ------------------------------- | ------------------------------------------------ |
| `PGHOST`                        | Aurora PostgreSQL cluster endpoint               |
| `PGDATABASE`                    | Database name (defaults to `postgres`)           |
| `PGUSER`                        | Database user (defaults to `postgres`)           |
| `AWS_ROLE_ARN`                  | IAM role assumed via Vercel OIDC for DB + Bedrock|
| `AWS_REGION`                    | AWS region for Aurora and Bedrock                |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase project URL (admin auth)                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (admin auth)                   |
| `RESEND_API_KEY`                | Resend API key for OTP and confirmation emails   |

Database access uses short-lived IAM auth tokens rather than a static password — no DB password is stored anywhere.

---

## Project Structure

```
app/                  Next.js App Router routes
  page.tsx            Public home / campaign directory
  about/              About page
  campaign/[slug]/    Public campaign + shared poem
  visualize/          Global contribution density map
  dashboard/          Admin dashboard (campaigns, contributions, authors, settings)
  auth/               Supabase login, callback, error routes
  flows/              Interactive user flow diagrams
components/           UI components (admin/, ui/, site-level)
lib/
  db.ts               Aurora PostgreSQL pool with IAM auth
  queries.ts          Read queries (server-only)
  actions.ts          Server Actions (mutations + auth)
  ai-moderation.ts    AWS Bedrock couplet moderation pipeline
  supabase/           Supabase SSR client + session proxy
scripts/              SQL schema, indexes, and migration files
middleware.ts         Refreshes Supabase sessions on each request
```

---

## Accomplishments

- Successfully modernized a 2015 legacy codebase into a high-performance, serverless-native application.
- Implemented production-grade database optimizations including **partial indexes** (`idx_contributions_poem`, `idx_email_otps_active`) and **cascading foreign keys** for referential integrity.
- Achieved enterprise-level observability and security standards while maintaining a focus on inclusive, keyboard-navigable design.

---

## Future Roadmap

- **Multi-language Support** — Localized AI moderation prompts for global campaigns.
- **Contributor Portfolios** — Opt-in profile pages for repeat authors.
- **Automation** — Vercel Cron-based campaign scheduling and auto-close functionality.
- **Integration** — Webhooks for Slack/CMS synchronization and generative AI for banner image creation.
- **SaaS Transition** — Exploring subscription models to ensure long-term platform sustainability.

---

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [v0 Documentation](https://v0.app/docs)
- [ARCHITECTURE.md](./ARCHITECTURE.md) — system architecture (Vercel + AWS)
- [use_cases.md](./use_cases.md) — full use cases and user flows
- [summary.md](./summary.md) — project summary and hackathon write-up
