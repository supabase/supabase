# Image blurhash template

Computes a [blurhash](https://blurha.sh) string for every image uploaded to the `images` bucket and stores it in `public.image_blurhashes`. Use the hash as a lightweight placeholder while the full image loads on the client.

## How it works

1. A user uploads an image to the `images` bucket.
2. A trigger on `storage.objects` inserts a row in `public.image_blurhashes` and invokes the `image-blurhash` Edge Function via `pg_net`.
3. The function downloads the image, decodes it, computes the blurhash, and updates the row.

## Includes

- `supabase/schemas/image-blurhash.sql` — bucket, tracking table, RLS, and trigger
- `supabase/functions/image-blurhash/index.ts` — decode and hash worker
- `supabase/seed.sql` — local `project_url` secret used by `pg_net`

## Dependencies

Requires **storage**, **database**, and **functions**.
