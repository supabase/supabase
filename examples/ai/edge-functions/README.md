# AI Inference in Supabase Edge Functions

Since Supabase Edge Runtime [v1.36.0](https://github.com/supabase/edge-runtime/releases/tag/v1.36.0) you can run the [`gte-small` model](https://huggingface.co/Supabase/gte-small) natively within Supabase Edge Functions without any external dependencies! This allows you to easily generate text embeddings without calling any external APIs!

## Semantic Search with pgvector and Supabase Edge Functions

This demo consists of three parts:

1. A [`generate-embedding`](./supabase/functions/generate-embedding/index.ts) database webhook edge function which generates embeddings when a content row is added (or updated) in the [`public.embeddings`](./supabase/migrations/20240408072601_embeddings.sql) table.
2. A [`query_embeddings` Postgres function](./supabase/migrations/20240410031515_vector-search.sql) which allows us to perform similarity search from an egde function via [Remote Procedure Call (RPC)](https://supabase.com/docs/guides/database/functions?language=js).
3. A [`search` edge function](./supabase/functions/search/index.ts) which generates the embedding for the search term, performs the similarity search via RPC function call, and returns the result.

## Deploy

- Link your project: `supabase link`
- Deploy Edge Functions: `supabase functions deploy`
- Enable Database Webhooks in your [project dashboard](https://supabase.com/dashboard/project/_/database/hooks)
- Navigate to the [database-webhook](./supabase/migrations/20240410041607_database-webhook.sql) migration file and insert your `generate-embedding` function details.
- Push up the database schema `supabase db push`

## Run

Run a search via curl POST request:

```bash
curl -i --location --request POST 'https://<PROJECT-REF>.supabase.co/functions/v1/search' \
    --header 'Authorization: Bearer <SUPABASE_ANON_KEY>' \
    --header 'Content-Type: application/json' \
    --data '{"search":"vehicles"}'
```
