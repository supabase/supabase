-- Brand scoping for uploaded assets and featured examples (Supaimage
-- multi-brand phase) — follow-up to 0001_init.sql / 0002_logo_assets.sql.
--
-- Brand DEFINITIONS (colors, stroke weights) are code, not data — see
-- lib/design/brands/. Only the things people actually upload/curate per brand
-- (icons/logos, featured examples) need a `brand` column so they don't bleed
-- across brands. Existing rows default to 'supabase' (no data migration
-- needed beyond the column add — Supabase was the only brand until now).
--
-- Apply in the Supabase dashboard → SQL Editor. Idempotent.

alter table public.assets
  add column if not exists brand text not null default 'supabase';

alter table public.featured_examples
  add column if not exists brand text not null default 'supabase';

-- Index for the common "assets for this brand" query pattern.
create index if not exists assets_brand_idx on public.assets (brand);
create index if not exists featured_examples_brand_idx on public.featured_examples (brand);
