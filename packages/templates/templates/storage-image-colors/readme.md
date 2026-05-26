# Image color extraction template

Extracts a dominant color palette from every image uploaded to the `images` bucket. The primary and secondary colors are stored in `public.image_colors` so the client can tint UI (placeholders, gradients, hero backgrounds) without shipping the full image first.

## How it works

1. A user uploads an image to the `images` bucket.
2. A trigger on `storage.objects` inserts a row in `public.image_colors` and invokes the `image-colors` Edge Function via `pg_net`.
3. The function downloads the image, runs a simple color quantization, and updates the row with the top colors and a JSON palette.

The implementation uses median-cut quantization to stay dependency-light and Edge Runtime friendly. Swap it for `node-vibrant` or any other algorithm if you need more nuanced palettes.

## Includes

- `supabase/schemas/image-colors.sql` — bucket, tracking table, RLS, and trigger
- `supabase/functions/image-colors/index.ts` — palette extraction worker
- `supabase/seed.sql` — local `project_url` secret used by `pg_net`

## Dependencies

Requires **storage**, **database**, and **functions**. Pairs well with **storage-image-blurhash** for low-bandwidth image placeholders.
