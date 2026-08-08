-- Custom color logos (partnerships, acquisitions, co-marketing) — follow-up to
-- 0001_init.sql. Logos render in their ORIGINAL colors (no stroke
-- normalization, unlike line icons) via `assets.kind = 'logo'`, stored in the
-- og-assets Storage bucket (already created in 0001) rather than inline, since
-- they may be raster. width/height are captured at upload time (client-measured
-- natural pixel size) so the renderer can fit them without distortion.
--
-- Apply in the Supabase dashboard → SQL Editor. Idempotent.

alter table public.assets
  add column if not exists width  integer,
  add column if not exists height integer;
