# Uptime Monitor

Check your websites on a schedule and see incidents the moment they open. Built with Supabase Cron, Queues and Edge Functions, plus React, Vite and [TanStack DB](https://tanstack.com/db/latest).

- **Cron**: every 30 seconds, `private.queue_checks()` puts one message per active monitor on the `uptime_checks` queue and calls the worker.
- **Queues**: checks go through Supabase Queues (`pgmq`). The worker claims a batch with a visibility timeout, so a check that fails mid-way is retried instead of lost.
- **Edge Functions**: the `run-checks` worker requests each URL with a 10-second timeout and records the status, response time and any error.
- **Incidents**: `record_check` opens an incident after two failures in a row and resolves it on the next success, all in one transaction.
- **Auth and RLS**: visitors sign in anonymously and only see their own monitors, checks and incidents. Only the worker, with the secret key, can record checks.
- **Data layer**: monitors, checks and incidents are TanStack DB collections from [`@supabase-labs/tanstack-db`](https://github.com/supabase/tanstack-db) (`src/collections.ts`). New checks and incidents arrive over Realtime as the worker records them.
- **Light and dark**: follows the system setting, with a System / Light / Dark switch in the header.

Each person can add up to 5 monitors. To limit which hosts can be monitored (useful for a public demo), add them to `private.allowed_hosts`; when it is empty, any URL is allowed. A nightly Cron job keeps a week of checks and a month of resolved incidents, and removes monitors created by guest (anonymous) users after a day.

The whole schema, queue and Cron jobs are in [`supabase/migrations`](./supabase/migrations).

> `@supabase-labs/tanstack-db` is experimental. Its 0.1.0 release targets `@tanstack/db` 0.x, so `package.json` pins the matching TanStack DB versions with `overrides`.

## Run it

1. **Local:** run `supabase start`. It applies the migration and `supabase/config.toml` (including anonymous sign-ins) for you, and `supabase functions serve` runs the Edge Functions. Skip to step 3.

   **Hosted:** create a project in the dashboard or with `supabase projects create`.

2. For a hosted project, link it, apply the migration and auth config, and deploy the worker:

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   supabase config push
   supabase functions deploy run-checks
   ```

   `config push` turns on anonymous sign-ins (`enable_anonymous_sign_ins` in `supabase/config.toml`).

3. Give the Cron job your project URL and secret key, in the SQL editor. Use the full secret key (`supabase projects api-keys --reveal`):

   ```sql
   select vault.create_secret('https://<your-project-ref>.supabase.co', 'project_url');
   select vault.create_secret('<your secret key>', 'secret_key');
   ```

4. Copy `.env.example` to `.env.local` and add your project URL and publishable key.
5. Start the app:

   ```bash
   npm install
   npm run dev
   ```

## Deploy to Vercel

```bash
vercel link
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
vercel deploy
```
