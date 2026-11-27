# Kanban Board

A collaborative Kanban board built with Supabase, React, Vite and [TanStack DB](https://tanstack.com/db/latest). Cards move live between everyone on the board.

- **Auth**: visitors sign in anonymously, so the board works without an account.
- **Database**: boards, members and cards, with row level security that scopes every card to board members. Anyone with a board's invite link can join it.
- **Data layer**: cards are a TanStack DB collection from [`@supabase-labs/tanstack-db`](https://github.com/supabase/tanstack-db) (`src/collections.ts`). A live query filters and sorts a board's cards, mutations apply optimistically and roll back if Postgres or RLS rejects them, and other members' changes arrive over Realtime with no subscription code.
- **Presence**: a small Realtime channel shows who is online.
- **Light and dark**: follows the system setting, with a System / Light / Dark switch in the header.
- **Ordering**: cards use fractional positions, so moving a card only updates that card's row.

The whole schema is in [`supabase/migrations`](./supabase/migrations).

> `@supabase-labs/tanstack-db` is experimental, and its Realtime sync can use more messages than hand-written subscriptions. `realtimeUseFilter` limits it to the open board. Its 0.1.0 release targets `@tanstack/db` 0.x, so `package.json` pins the matching TanStack DB versions with `overrides`.

## Run it

1. **Local:** run `supabase start`. It applies the migration and `supabase/config.toml` (including anonymous sign-ins) for you. Skip to step 3.

   **Hosted:** create a project in the dashboard or with `supabase projects create`.

2. For a hosted project, link it and apply the migration and auth config:

   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push
   supabase config push
   ```

   `config push` turns on anonymous sign-ins (`enable_anonymous_sign_ins` in `supabase/config.toml`).

3. Copy `.env.example` to `.env.local` and add your project URL and publishable key.
4. Start the app:

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

Then set the deployed URL as the Site URL in your project's Auth settings.
