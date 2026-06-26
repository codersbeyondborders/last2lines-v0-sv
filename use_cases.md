# Last 2 Lines — Use Cases & User Flows

## Actors

| Actor | Description |
|---|---|
| **Visitor** | Any unauthenticated person browsing the site. |
| **Contributor** | A visitor who submits a two-line couplet to a campaign. No account required. |
| **Admin** | An authenticated operator who manages campaigns, moderates contributions, and manages authors. Authenticated via Supabase Auth. |
| **AI Moderator** | AWS Bedrock (Amazon Nova Micro), invoked automatically per submission when enabled. Not a human actor. |

---

## Public Use Cases

### UC-01 — Browse the Campaign Directory

**Actor:** Visitor  
**Entry point:** `/` (homepage)

**Flow:**
1. Visitor lands on the homepage, which renders the hero section, live stats (total campaigns, authors, lines), and a filterable campaign directory.
2. The directory lists all non-draft campaigns with their title, tagline, status badge, and contributor/line counts.
3. Visitor optionally filters campaigns by status (`active`, `upcoming`, `completed`) using the client-side filter tabs.
4. Visitor clicks a campaign card to navigate to `/campaign/[slug]`.

**Outcomes:**
- Visitor finds an active campaign and proceeds to contribute (UC-02).
- Visitor reads the poem on a completed campaign (UC-04).

---

### UC-02 — View a Campaign Page

**Actor:** Visitor  
**Entry point:** `/campaign/[slug]`

**Flow:**
1. Next.js Server Component fetches the campaign by slug from RDS. Returns 404 if not found.
2. Page renders in sections:
   - **Hero** — background image, title, tagline, status, campaign phase (upcoming / active / completed).
   - **Stats bar** — voice count (always 1), contributor count, total line count.
   - **About** — description, open/close dates, optional video link and donation link.
   - **Instructions** — numbered steps on how to contribute.
   - **Living poem** (streamed via `<Suspense>`) — seed couplets from the admin followed by approved community couplets in `sequence_number` order.
   - **Contribution form** — visible if the campaign is active; replaced by a closed/upcoming notice otherwise.
3. The poem section revalidates every 30 seconds.

**Outcomes:**
- Visitor reads the growing poem.
- Visitor fills in the submission form (UC-03).
- Visitor clicks the video or donation links.

---

### UC-03 — Submit a Couplet (Standard Flow — No Email Verification Required)

**Actor:** Contributor  
**Entry point:** Contribution form on `/campaign/[slug]`  
**Precondition:** Campaign `status = 'active'`, current time is within `start_date`–`close_date`.

**Flow:**
1. Contributor fills in the form:
   - Full name (required)
   - Email address (required, validated format)
   - Line 1 (required, max 100 characters — live counter shown)
   - Line 2 (required, max 100 characters — live counter shown)
   - Consent checkbox (required)
2. Client-side validation runs on each blur and on submit. Fields with errors show red borders and inline messages. Submit button is disabled if validation fails.
3. Contributor clicks "Submit to the Poem". A loading spinner appears.
4. `submitContribution` Server Action runs:
   - Re-validates all fields server-side.
   - Confirms campaign exists and is open (status + date window).
   - If `ai_moderation = true`, calls `moderateCouplet` (AWS Bedrock):
     - Fetches last two approved couplets for context.
     - Returns one of three verdicts:
       - **publish** → `status = 'approved'`, sequence number assigned, published immediately.
       - **curate** → AI rewrites the lines, `status = 'approved'`, published with curated text.
       - **manual** → `status = 'pending'`, queued for human review.
   - If AI is unavailable, falls back to `manual` (never auto-rejects).
   - Upserts author by email (creates if new; updates name/country if existing).
   - Checks if the author is banned — returns an error if so.
   - Inserts the contribution with the resolved status.
   - Calls `revalidatePath` on the campaign page and dashboard.
5. Success screen: "Your lines are on their way." with an option to write another couplet.

**Error paths:**
- Campaign not found or not open → error message shown.
- Author is banned → error message shown.
- Network/DB failure → error message shown; no data lost.

---

### UC-04 — Submit a Couplet (Email Verification Required)

**Actor:** Contributor  
**Entry point:** Contribution form on `/campaign/[slug]`  
**Precondition:** Campaign has `require_email_verification = true`.

**Flow:**
1. Contributor fills in the form (same as UC-03).
2. After basic validation passes, the form enters an OTP verification step:
   - A `POST /api/send-otp` request is made with `{ email, campaignId, campaignTitle }`.
   - Server invalidates any existing unused OTPs for that email+campaign pair.
   - A 6-digit code is generated, SHA-256 hashed, and stored in `email_otps` with a 15-minute expiry.
   - An email is sent via Resend (or in mock mode, the code is logged to the console and returned in the response as `mockCode`).
3. Contributor enters the 6-digit code in the inline OTP input.
4. A `POST /api/verify-otp` request is made with `{ email, campaignId, code }`:
   - The code is hashed and compared against the stored record.
   - Checks: not already `used`, not expired.
   - If valid: marks OTP as `used`, returns `{ ok: true }`.
5. With `emailVerified = true`, `submitContribution` is called.
   - The AI moderation verdict is used directly (the `emailVerified` flag is trusted).
   - The contribution is stored with `email_verified = true`.
6. Success screen as in UC-03.

**Error paths:**
- Invalid code → "Invalid verification code."
- Expired code → "This code has expired. Please request a new one."
- Already used → "This code has already been used."
- Resend API failure → error message; no OTP stored.

---

### UC-05 — Read the Living Poem

**Actor:** Visitor  
**Entry point:** `#poem` anchor on `/campaign/[slug]`

**Flow:**
1. The `<PoemSection>` Server Component fetches seed couplets and approved contributions in parallel.
2. Seed couplets (added by admin during campaign creation) are displayed first, followed by community couplets ordered by `sequence_number ASC`.
3. Each couplet is rendered as two lines. Seed couplets are visually distinguished.
4. If no couplets exist yet, an empty state is shown.

---

### UC-06 — View Global Contributions Map

**Actor:** Visitor  
**Entry point:** `/visualize`

**Flow:**
1. Page fetches all campaigns and per-country contribution aggregates from RDS.
2. An interactive world map renders with country-level choropleth shading based on approved contribution density.
3. Visitor can:
   - Hover a country to see a tooltip with stats.
   - Click a country to pin a detail card showing rank and count.
   - Switch between an aggregate view and per-campaign views using campaign tabs.
   - Zoom and pan the map.
4. A ranked sidebar lists the top contributing countries.
5. If the database is unavailable, the component falls back to built-in mock data.

---

### UC-07 — View the About Page

**Actor:** Visitor  
**Entry point:** `/about`

**Flow:**
1. Visitor navigates to the about page via the site header.
2. Reads the platform's mission and editorial approach.

---

### UC-08 — View the Contact Page

**Actor:** Visitor  
**Entry point:** `/contact`

---

### UC-09 — View Terms & Conditions

**Actor:** Visitor  
**Entry point:** `/terms`

---

## Admin Use Cases

### UC-10 — Admin Sign In

**Actor:** Admin  
**Entry point:** `/auth/login`

**Flow:**
1. Admin navigates to `/auth/login` (or is redirected there from any `/dashboard/*` route when unauthenticated).
2. The middleware matcher runs `updateSession` on every dashboard/auth/API route to refresh the Supabase session cookie.
3. Admin enters email and password.
4. `supabase.auth.signInWithPassword()` is called from the browser client.
5. On success: admin is redirected to `/dashboard` (or the `?next=` query param destination).
6. On failure: inline error alert is shown ("Invalid login credentials" or similar).

**Session lifecycle:**
- The Supabase session cookie is refreshed on every subsequent request via Edge Middleware.
- Admin-only Server Actions call `requireAdmin()` which calls `supabase.auth.getUser()` — throws if no valid session.

---

### UC-11 — Admin Sign Out

**Actor:** Admin  
**Entry point:** Any page in the admin dashboard

**Flow:**
1. Admin clicks "Sign out" in the sidebar.
2. `signOut()` Server Action calls `supabase.auth.signOut()`.
3. Session cookie is cleared; admin is redirected to `/auth/login`.

---

### UC-12 — View Dashboard Overview

**Actor:** Admin  
**Entry point:** `/dashboard`

**Flow:**
1. Server Component calls `getDashboardSummary()` — single SQL round-trip returning:
   - Total campaigns, active campaigns count.
   - Pending contributions count, approved contributions count.
   - Total authors, banned authors count.
2. Calls `getContributionsByStatus('pending')` to show the live moderation queue preview.
3. Dashboard renders four metric cards and a preview list of pending contributions with their status badges.
4. "View all" button navigates to `/dashboard/contributions`.

---

### UC-13 — Manage Campaigns List

**Actor:** Admin  
**Entry point:** `/dashboard/campaigns`

**Flow:**
1. Server Component calls `getCampaigns()` — returns all campaigns newest-first with approved couplet counts.
2. Table renders with: title, slug, status badge, AI moderation indicator, contribution count, start/close dates.
3. Admin can:
   - Click a campaign row to navigate to its detail/edit page (UC-14).
   - Click "New campaign" to navigate to `/dashboard/campaigns/new` (UC-15).

---

### UC-14 — Edit a Campaign

**Actor:** Admin  
**Entry point:** `/dashboard/campaigns/[id]`

**Flow:**
1. Server Component fetches the campaign by ID. Returns 404 if not found.
2. The `CampaignForm` renders pre-populated with all existing values.
3. Admin can modify: title, tagline, description, status, start/close dates, AI moderation toggle, AI level, background image URL, video link, donation link, email verification toggle, auto-email-on-publish toggle, featured flag, seed couplets.
4. Admin clicks "Save changes". `updateCampaign(id, input)` Server Action is called:
   - `requireAdmin()` is verified.
   - Campaign row is updated in RDS.
   - Existing seed couplets are deleted and re-inserted from the form input.
   - `revalidatePath` is called on campaign detail, campaigns list, dashboard, and homepage.
5. On success: toast/redirect to the campaigns list.
6. Admin can also click "Delete campaign":
   - `deleteCampaign(id)` Server Action is called.
   - The campaign row is deleted; `ON DELETE CASCADE` removes all child records (contributions, moderation settings, seed couplets, email OTPs).
   - Redirects to `/dashboard/campaigns`.

---

### UC-15 — Create a New Campaign

**Actor:** Admin  
**Entry point:** `/dashboard/campaigns/new`

**Flow:**
1. Admin fills in the `CampaignForm` (all fields empty/defaulted).
2. Required fields: title, start date, close date, status.
3. Optional fields: tagline, description, AI moderation settings, background image URL, video link, donation link, require email verification, auto email on publish, featured, seed couplets (one or more pre-authored couplets to seed the poem).
4. Admin clicks "Create campaign". `createCampaign(input)` Server Action is called:
   - `requireAdmin()` is verified.
   - A `nanoid`-based ID (`cmp_…`) is generated.
   - A URL-safe slug is generated from the title with a short random suffix to ensure uniqueness.
   - Campaign is inserted into RDS.
   - Seed couplets are inserted into `seed_couplets` with ascending sequence numbers.
   - `revalidatePath` is called on campaigns list, dashboard, and homepage.
5. On success: admin is redirected to the new campaign's edit page.

---

### UC-16 — Moderate a Contribution (Approve / Reject / Re-queue)

**Actor:** Admin  
**Entry point:** `/dashboard/contributions`

**Flow:**
1. Server Component calls `getAllContributions()` with cursor-based pagination (50 per page, keyset on `created_at DESC`).
2. Admin can filter by status (`all`, `pending`, `approved`, `rejected`) and campaign using the filter tabs.
3. Status counts (`pending`, `approved`, `rejected`, `all`) are fetched in a single aggregate query.
4. For each contribution, admin can:
   - **Approve** → `moderateContribution({ id, status: 'approved', reason })`:
     - Assigns next `sequence_number` for the campaign (via `MAX(sequence_number) + 1`).
     - Sets `status = 'approved'`.
     - If `auto_email_on_publish = true` on the campaign, sends a confirmation email to the author via Resend (`sendPublishConfirmationEmail`), and records `publish_email_sent_at`.
   - **Reject** → `moderateContribution({ id, status: 'rejected', reason })`:
     - Sets `status = 'rejected'`, `sequence_number = 0`.
   - **Re-queue** → `moderateContribution({ id, status: 'pending' })`:
     - Sets `status = 'pending'`, `sequence_number = 0`.
5. The contribution row is updated in-place in the client list (optimistic update).
6. `revalidatePath` refreshes the dashboard, contributions view, and all campaign pages.

---

### UC-17 — Edit Contribution Lines

**Actor:** Admin  
**Entry point:** `/dashboard/contributions`

**Flow:**
1. Admin clicks the edit action on any contribution in the table.
2. An inline edit form appears with the current `line_one` and `line_two` values (100-char limit each).
3. Admin edits the text and confirms.
4. `editContribution({ id, lineOne, lineTwo })` Server Action is called:
   - `requireAdmin()` is verified.
   - Lines are validated (non-empty, ≤ 100 chars).
   - `UPDATE contributions SET line_one = $2, line_two = $3 WHERE id = $1`.
   - `revalidatePath` on campaign pages and contributions view.
5. Status is unchanged — the edit only modifies the text.

---

### UC-18 — Delete a Contribution

**Actor:** Admin  
**Entry point:** `/dashboard/contributions`

**Flow:**
1. Admin clicks "Delete" on a contribution row.
2. `deleteContribution(id)` Server Action is called:
   - `requireAdmin()` is verified.
   - `DELETE FROM contributions WHERE id = $1`.
   - `revalidatePath` on campaign pages, contributions view, and dashboard.
3. Row disappears from the table.

---

### UC-19 — Manage Authors (View, Ban, Unban)

**Actor:** Admin  
**Entry point:** `/dashboard/authors`

**Flow:**
1. Server Component calls `getAuthors()` — cursor-paginated list of authors, newest first.
2. `getSubmissionCounts()` returns a map of `authorId → totalSubmissions` (all statuses).
3. Table renders: name, email, country, joined date, submission count, status badge.
4. Admin can:
   - **Ban** → `setAuthorStatus({ id, status: 'banned' })`:
     - Updates `authors.status = 'banned'`.
     - Future submissions from this email are immediately rejected at the `submitContribution` level.
     - Existing contributions are unaffected.
   - **Unban** → `setAuthorStatus({ id, status: 'active' })`.
5. Admin can "Load more" to fetch additional pages via the `fetchAuthorsPage` Server Action.

---

### UC-20 — Update Moderation Settings for a Campaign

**Actor:** Admin  
**Entry point:** `/dashboard/settings`

**Flow:**
1. Admin selects a campaign from the settings page.
2. Current `moderation_settings` row is fetched for that campaign.
3. Admin adjusts: level (`lenient` / `standard` / `strict`), profanity filter toggle, enforce-theme toggle, confidence threshold (0–1).
4. Admin saves. `updateModerationSettings(input)` Server Action is called:
   - `requireAdmin()` is verified.
   - `INSERT … ON CONFLICT (campaign_id) DO UPDATE` — upserts the settings row.
   - `revalidatePath` on settings page.

---

### UC-21 — Image Upload for Campaign Background

**Actor:** Admin  
**Entry point:** `CampaignForm` within `/dashboard/campaigns/new` or `/dashboard/campaigns/[id]`

**Flow:**
1. Admin clicks the image upload field in the campaign form.
2. The file is sent as `multipart/form-data` to `POST /api/upload`.
3. The API route validates file type and size, then stores the file in Vercel Blob storage (private bucket).
4. The returned blob URL is set as the `background_image_url` field in the campaign form.
5. The URL is persisted when the form is saved (UC-14 / UC-15).

---

## System / Background Flows

### SF-01 — AI Moderation Pipeline

**Trigger:** `submitContribution` when `campaign.ai_moderation = true`

**Steps:**
1. Fetch last two approved couplets for the campaign (poem context).
2. Build a system prompt with: editorial role description, three-tier decision rules, and level-specific guidance (`lenient` / `standard` / `strict`).
3. Build a user prompt with: campaign title, theme, description, previous couplets, and the new submission.
4. Call `generateText` (Vercel AI Gateway → AWS Bedrock / Amazon Nova Micro) with a Zod-structured output schema.
5. Parse the response:
   - `publish` → use original lines, `status = 'approved'`.
   - `curate` → use AI-rewritten lines, `status = 'approved'`.
   - `manual` → leave lines as-is, `status = 'pending'`.
6. On any error (timeout, model failure, parse failure): return `{ decision: 'manual', fallback: true }` — never throws, never auto-rejects.

---

### SF-02 — Publish Confirmation Email

**Trigger:** `moderateContribution` when `status = 'approved'` and `campaign.auto_email_on_publish = true`

**Steps:**
1. Fetch author email from the contributions JOIN.
2. POST to `https://api.resend.com/emails` with the author's address, campaign title, and a link to the campaign page.
3. On success: `UPDATE contributions SET publish_email_sent_at = now()`.
4. On failure: log the error; contribution remains approved (email failure is non-fatal).

---

### SF-03 — Edge Middleware Session Refresh

**Trigger:** Every request matching `/dashboard/*`, `/admin/*`, `/auth/*`, `/verify-email-result`, `/api/*`

**Steps:**
1. `middleware.ts` calls `updateSession(request)` from `lib/supabase/proxy.ts`.
2. The Supabase SSR client reads the session cookie and calls the Supabase Auth service to refresh the token if needed.
3. The refreshed cookie is written to the response headers.
4. Static assets, images, and all public routes (`/`, `/campaign/[slug]`, `/about`, etc.) bypass middleware entirely.

---

### SF-04 — OTP Expiry / Cleanup

**Trigger:** Periodic or on next send for the same email+campaign

**Steps:**
1. When `POST /api/send-otp` is called for an `email + campaignId` pair, all existing unused OTPs for that pair are immediately marked `used = true` (invalidated).
2. The `idx_email_otps_active` partial index (on `used = false`) keeps verification lookups fast.
3. Expired OTPs remain in the table until a cleanup job (using `idx_email_otps_expires` on `expires_at`) removes them.

---

## Route & Permission Matrix

| Route | Public | Admin Required | Notes |
|---|---|---|---|
| `/` | Yes | — | Homepage, campaign directory |
| `/campaign/[slug]` | Yes | — | Campaign page, poem, submission form |
| `/about` | Yes | — | Static-ish page |
| `/contact` | Yes | — | Static-ish page |
| `/terms` | Yes | — | Terms & conditions |
| `/visualize` | Yes | — | World map, anonymous data only |
| `/verify-email-result` | Yes | — | Post-OTP redirect page |
| `/auth/login` | Yes | — | Supabase Auth login form |
| `/auth/callback` | Yes | — | Supabase OAuth callback |
| `/auth/error` | Yes | — | Auth error page |
| `/dashboard/*` | No | Yes | Full dashboard suite |
| `/admin/seed` | No | Yes | Dev seed page |
| `POST /api/send-otp` | Yes | — | Email OTP send |
| `POST /api/verify-otp` | Yes | — | Email OTP verify |
| `POST /api/upload` | No | Yes | Image upload (Vercel Blob) |
| `POST /api/send-verification-email` | Yes | — | Link-based email verification |
| `GET /api/verify-email/[token]` | Yes | — | Token-based email verification callback |

---

## Validation Rules Summary

| Field | Rule |
|---|---|
| Full name | Required, non-empty after trim |
| Email | Required, must match `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` |
| Line 1 / Line 2 | Required, max 100 characters each |
| Consent | Must be checked |
| Campaign status (submit) | Must be `active` and within `start_date`–`close_date` |
| Author status (submit) | Must not be `banned` |
| OTP code | SHA-256 hashed match, not `used`, not expired (15 min) |
| Campaign title (admin) | Required, non-empty after trim |
| Admin actions | Must have a valid Supabase session (`requireAdmin()`) |
