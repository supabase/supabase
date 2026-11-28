# Photo Wall

A shared photo wall built with Supabase, React, Vite and [TanStack DB](https://tanstack.com/db/latest). Invite people with a link, drop in photos from any device and watch the wall fill up live.

- **Storage**: photos are uploaded to a public `photos` bucket under `<wall id>/`. The bucket only accepts JPEG, PNG, WebP and GIF files up to 5 MB, and a storage policy limits each person to 30 uploads an hour.
- **Image transformations**: thumbnails and the full-size view are resized on the fly by Storage (`getPublicUrl(path, { transform })`) and cached by the CDN, so there is no image-processing code.
- **Auth**: visitors sign in anonymously, so the wall works without an account.
- **Database**: walls, members and photos, with row level security. Members can add photos and see the wall; only the uploader can delete a photo, in the table and in Storage.
- **Data layer**: photos are a TanStack DB collection from [`@supabase-labs/tanstack-db`](https://github.com/supabase/tanstack-db) (`src/collections.ts`). A live query shows the wall, and new photos from other members arrive over Realtime.
- **Cron and Edge Functions**: every night a Cron job calls the `cleanup` Edge Function, which deletes photos older than `RETENTION_DAYS` (default 7) from Storage and the database.
- **Light and dark**: follows the system setting, with a System / Light / Dark switch in the header.

The whole schema, bucket and Cron job are in [`supabase/migrations`](./supabase/migrations).

> `@supabase-labs/tanstack-db` is experimental. Its 0.1.0 release targets `@tanstack/db` 0.x, so `package.json` pins the matching TanStack DB versions with `overrides`.

## Run it

1. **Local:** run `supabase start`. It applies the migration and `supabase/config.toml` (including anonymous sign-ins) for you, and `supabase functions serve` runs the Edge Functions. Skip to step 3.

   **Hosted:** create a project in the dashboard or with `supabase projects create`.

2. For a hosted project, link it and apply the migration and auth config, and deploy the cleanup function:

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   supabase config push
   supabase functions deploy cleanup
   ```

   `config push` turns on anonymous sign-ins (`enable_anonymous_sign_ins` in `supabase/config.toml`).

3. Give the nightly Cron job the URL it calls the cleanup function at and your secret key, in the SQL editor.

   **Hosted:** use your project URL and the full secret key (`supabase projects api-keys --reveal`):

   ```sql
   select vault.create_secret('https://<your-project-ref>.supabase.co', 'project_url');
   select vault.create_secret('<your secret key>', 'secret_key');
   ```

   Optionally change how long photos are kept: `supabase secrets set RETENTION_DAYS=30`.

   **Local:** the Cron job runs inside the database container, so `127.0.0.1` is the container itself. Use `host.docker.internal` (or your machine's local IP address if that doesn't resolve), and the secret key from `supabase status`:

   ```sql
   select vault.create_secret('http://host.docker.internal:54321', 'project_url');
   select vault.create_secret('<secret key from supabase status>', 'secret_key');
   ```

   To change how long photos are kept locally, add `RETENTION_DAYS=30` to `supabase/functions/.env` and restart `supabase functions serve`. You can skip this step entirely if you don't need the cleanup while developing.

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
