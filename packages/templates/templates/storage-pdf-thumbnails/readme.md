# PDF thumbnails template

Generates a preview image of the first page of every PDF uploaded to the `pdfs` bucket and stores it in the public `pdf-thumbnails` bucket. A row in `public.pdf_thumbnails` tracks status so clients can poll or subscribe over Realtime.

## How it works

1. A user uploads a PDF to the `pdfs` bucket.
2. A trigger on `storage.objects` inserts a row in `public.pdf_thumbnails` and invokes the `pdf-thumbnail` Edge Function via `pg_net`.
3. The function downloads the PDF, renders the first page to PNG, and uploads it to `pdf-thumbnails/<object_id>.png`.
4. The tracking row is updated to `ready` (or `failed` with an error message).

## Includes

- `supabase/schemas/pdf-thumbnails.sql` — buckets, tracking table, RLS, and trigger
- `supabase/functions/pdf-thumbnail/index.ts` — render-and-upload worker
- `supabase/seed.sql` — local `project_url` secret used by `pg_net`

## Configuration

The Edge Function uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` which are injected automatically in hosted projects. For local development, run `supabase functions serve pdf-thumbnail --no-verify-jwt` and set the `project_url` secret in `seed.sql` to your local Functions URL.

## Dependencies

Requires **storage**, **database**, and **functions**.
