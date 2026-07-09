# Sales Dashboard

Mobile-optimized sales dashboard: leads, quotes, activities/follow-ups, and a
pipeline overview. Phase 1 of a Salesforce/HubSpot-style mobile CRM.

## Stack

- Next.js (App Router) + React, using the monorepo's shared `ui` component
  library and Tailwind design tokens
- Supabase (Postgres + Auth) as the backend, with row-level security scoping
  every row to the signed-in user
- Deployed to Vercel

## Local development

1. Start a local Supabase project for this app and apply the migration:

   ```bash
   cd apps/sales-dashboard
   supabase start
   supabase db reset   # applies supabase/migrations
   ```

2. Copy `.env.local.example` to `.env.local` and fill in the values printed by
   `supabase status` (`API URL` → `NEXT_PUBLIC_SUPABASE_URL`, `anon key` →
   `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`).

3. From the repo root:

   ```bash
   pnpm install
   pnpm --filter=sales-dashboard dev
   ```

   The app runs at http://localhost:3005. Sign in with a magic link — Inbucket
   (started by the Supabase CLI) catches local dev emails at
   http://localhost:54324.

## Deploying

### Supabase (hosted project)

1. Create a project at https://supabase.com/dashboard.
2. Link it and push the migration:

   ```bash
   cd apps/sales-dashboard
   supabase link --project-ref <your-project-ref>
   supabase db push
   ```

3. In Authentication settings, enable email OTP / magic link sign-in (enabled
   by default) and add your Vercel deployment URL to the redirect allow list
   (Authentication → URL Configuration → Redirect URLs), e.g.
   `https://<your-app>.vercel.app/auth/callback`.

### Vercel

This app lives inside a Turborepo monorepo, so configure the Vercel project as
follows:

1. Import the repo in Vercel and set **Root Directory** to
   `apps/sales-dashboard`.
2. Vercel auto-detects the monorepo and will run the build through Turborepo;
   confirm the **Install Command** is `pnpm install` (repo root) and the
   **Build Command** is `cd ../.. && pnpm turbo run build --filter=sales-dashboard`
   (or leave Vercel's auto-detected Turborepo settings, which do this for you).
3. Add environment variables in the Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Deploy. Then add the production URL's `/auth/callback` path to the
   Supabase redirect allow list (see above).

## What's here (Phase 1)

- **Dashboard** (`/`) — revenue this month, quotes sent, win rate,
  follow-ups due, and pipeline by stage.
- **Leads** (`/leads`), **Quotes** (`/quotes`), **Activities** (`/activities`)
  — list views with quick status actions (mark a quote sent/accepted/declined,
  mark a follow-up done).
- **Quick add** — a floating action button opens a bottom sheet with tabs to
  add a lead, quote, or activity from anywhere in the app.

## Next up

Per the product plan, Phase 2 adds voice-based logging (speak an update, AI
drafts a lead/quote/activity entry for review) and a sales calendar for calls
and meetings. The `activities` table's `due_at` column is already in place to
support calendar views.
