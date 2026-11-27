# Waitlisted

A launch page with a waitlist that grows itself. People join with their name and email, get a referral link, and move up the list for every friend who joins through it. Built with Supabase, React and Vite.

- **Database and RLS**: each person can read and edit only their own entry. Emails and names never leave the database: the page gets the total, your own position and the top referrers by initials, from `waitlist_status()`.
- **Referrals**: a trigger resolves the `?ref=` code to the referrer (ignoring unknown codes and self-referrals) and keeps referral fields and emails from being changed afterwards. Ranking is by referrals, then sign-up time.
- **Realtime Broadcast from the database**: a statement trigger calls `realtime.send` on the public `waitlist` topic whenever someone joins or leaves, so every open page updates its count and position live, without exposing any rows.
- **Auth**: visitors sign in anonymously first, so one browser can only hold one spot.
- **Light and dark**: follows the system setting, with a System / Light / Dark switch in the header.

Change the name and copy in [`src/config.ts`](./src/config.ts). The schema is in [`supabase/migrations`](./supabase/migrations).

To export the list for your launch email:

```sql
select name, email, created_at from public.waitlist_entries order by created_at;
```

## Run it

1. Create a Supabase project, or run `supabase start` for a local one.
2. Link it and apply the migration and auth config:

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
