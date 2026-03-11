# postgres-on-the-edge

This function allows you to access your Supabase database directly via TCP from an edge function.

## Setup
1. Rename `.env.example` to `.env`
2. Insert Supabase database connection string for `DATABASE_URL` in `.env` file
3. Replace `DATABASE_URL` with your connection string.

## Deploy

1. Run `supabase functions deploy --no-verify-jwt postgres-on-the-edge`
2. Run `supabase secrets set --env-file supabase/functions/postgres-on-the-edge/.env`

To dive deeper into connecting to your Supabase database from the edge, check out the [Deno blog post](https://deno.com/blog/deploy-postgres-at-the-edge) or watch this [YouTube video walkthrough](https://www.youtube.com/watch?v=cl7EuF1-RsY).
