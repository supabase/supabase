-- OG Image Generator — v1 schema (brief §3, §6.5, §6.8).
--
-- Apply in the Supabase dashboard → SQL Editor (paste + Run), or via the
-- Supabase CLI. Idempotent: safe to run more than once.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

-- Curated art-direction precedent the AI reasons from. Public read.
create table if not exists public.featured_examples (
  id           text primary key,
  subject      text not null,
  icon_name    text not null,
  template_id  text not null,
  eyebrow      text,
  pattern      jsonb,
  why_it_works text not null,
  created_at   timestamptz not null default now()
);

-- Icon / logo library. Public read; writes land with team auth (later phase).
-- `body` holds inline SVG for line icons; `storage_path` points at an uploaded
-- file in the og-assets bucket for logos/custom art.
create table if not exists public.assets (
  id           uuid primary key default gen_random_uuid(),
  name         text not null unique,
  label        text not null,
  tags         text[] not null default '{}',
  kind         text not null default 'icon',   -- 'icon' | 'logo'
  view_box     text not null default '0 0 24 24',
  body         text,
  storage_path text,
  created_at   timestamptz not null default now()
);

-- Saved recipes / posts (the design-as-data record, §6.5/§6.9). Not exposed yet
-- — RLS stays closed until team auth defines ownership.
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  slug       text unique,
  recipe     jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.featured_examples enable row level security;
alter table public.assets            enable row level security;
alter table public.posts             enable row level security;

-- Public (anon) read of the two reference tables. No anon writes.
drop policy if exists "featured_examples public read" on public.featured_examples;
create policy "featured_examples public read"
  on public.featured_examples for select using (true);

drop policy if exists "assets public read" on public.assets;
create policy "assets public read"
  on public.assets for select using (true);

-- posts: intentionally no anon policies yet (locked until team auth).

-- ---------------------------------------------------------------------------
-- Storage bucket for uploaded assets (public read)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('og-assets', 'og-assets', true)
on conflict (id) do nothing;

drop policy if exists "og-assets public read" on storage.objects;
create policy "og-assets public read"
  on storage.objects for select using (bucket_id = 'og-assets');

-- ---------------------------------------------------------------------------
-- Seed: featured examples (mirrors lib/ai/examples.ts)
-- ---------------------------------------------------------------------------
insert into public.featured_examples (id, subject, icon_name, template_id, eyebrow, pattern, why_it_works) values
  ('ex-rls', 'row level security rls multi-tenant data isolation access control policies auth', 'lock', 'split-right', 'Security', '{"type":"grid","scale":"md","color":"white","opacity":0.05}', 'A padlock reads instantly as access control; the split layout keeps a longer security headline legible beside the icon.'),
  ('ex-scale', 'scale postgres database to millions of users read replicas performance throughput', 'database', 'bottom-left', 'Engineering', '{"type":"dots","scale":"md","color":"white","opacity":0.06}', 'A single database icon top-right keeps a technical scaling post clean; the bottom-left headline gives room for a longer title.'),
  ('ex-launch', 'launch week announcement announcing introducing new features keynote', 'zap', 'centered', 'Launch Week', '{"type":"dots","scale":"lg","color":"green","opacity":0.05}', 'A centered composition with the bolt icon signals a big launch moment and reads well at thumbnail size.'),
  ('ex-edge', 'edge functions global network cdn regions low latency serverless', 'globe', 'split-right', 'Product', '{"type":"grid","scale":"md","color":"white","opacity":0.05}', 'The globe conveys global/edge reach; the split layout pairs it cleanly with the feature name.'),
  ('ex-infra', 'infrastructure multi-region stacked services architecture platform migration', 'layers', 'stacked', 'Engineering', '{"type":"hlines","scale":"md","color":"white","opacity":0.06}', 'The layers icon suggests stacked infrastructure; headline-top / icon-bottom gives a structured, technical feel.'),
  ('ex-realtime', 'realtime presence broadcast live collaboration multiplayer websockets subscriptions', 'zap', 'split-right', 'Product', '{"type":"dots","scale":"md","color":"green","opacity":0.05}', 'The bolt reads as speed/real-time; a split layout keeps the feature headline front and center.'),
  ('ex-vector', 'pgvector vector embeddings similarity search ai semantic retrieval rag', 'database', 'split-right', 'AI', '{"type":"grid","scale":"sm","color":"green","opacity":0.05}', 'A database icon anchors a Postgres-native AI feature; the split layout supports a descriptive headline.')
on conflict (id) do nothing;
