# YourMind

A private place for everything you want to remember: links, notes and images, searchable by meaning. Built with Supabase, React, Vite and [TanStack DB](https://tanstack.com/db/latest).

- **Vectors**: every item is embedded with **gte-small**, the model built into Supabase Edge Functions, so there is no third-party AI key. Embeddings are stored with pgvector in `item_embeddings` (kept out of the synced `items` table) with an HNSW index.
- **Semantic search**: the `search` Edge Function embeds your query and calls `match_items`, a security-invoker Postgres function, so search only ever sees your own items. Results are kept close to the best match.
- **Link previews**: the `save-item` Edge Function reads a link's title, description, preview image and site name (falling back to the first paragraph), then embeds it.
- **Storage**: images go to a private `minds` bucket, one folder per person, and are shown through signed, resized URLs (image transformations).
- **Auth and RLS**: visitors sign in anonymously. Every item, embedding and file is visible only to its owner.
- **Data layer**: items are a TanStack DB collection from [`@supabase-labs/tanstack-db`](https://github.com/supabase/tanstack-db). Saves show instantly, and the finished preview is written back as soon as `save-item` returns.
- **Light and dark**: follows the system setting, with a System / Light / Dark switch in the header.

The schema, bucket and search function are in [`supabase/migrations`](./supabase/migrations); the Edge Functions are in [`supabase/functions`](./supabase/functions).

> `@supabase-labs/tanstack-db` is experimental. Its 0.1.0 release targets `@tanstack/db` 0.x, so `package.json` pins the matching TanStack DB versions with `overrides`.

## Run it

1. **Local:** run `supabase start`. It applies the migration and `supabase/config.toml` (including anonymous sign-ins) for you, and `supabase functions serve` runs the Edge Functions. Skip to step 3.

   **Hosted:** create a project in the dashboard or with `supabase projects create`.

2. For a hosted project, link it, apply the migration and auth config, and deploy the functions:

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   supabase config push
   supabase functions deploy save-item
   supabase functions deploy search
   ```

   `config push` turns on anonymous sign-ins (`enable_anonymous_sign_ins` in `supabase/config.toml`).

3. Copy `.env.example` to `.env.local` and add your project URL and publishable key.
4. Start the app:

   ```bash
   npm install
   npm run dev
   ```

The `cleanup` function is optional. It deletes guest users older than `PURGE_GUEST_DAYS`, with their images, which is useful for a public demo. See [Running the public demos](../README.md#running-the-public-demos).

## Deploy to Vercel

```bash
vercel link
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_PUBLISHABLE_KEY
vercel deploy
```
