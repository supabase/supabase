
-- Run this in the Supabase SQL editor before `npm run ingest`.
-- Safe to re-run: it uses IF NOT EXISTS / CREATE OR REPLACE.

-- One row per markdown *section* (a heading + the text below it, up to the next heading).
create table if not exists public.docs_sections (
  id            bigint generated always as identity primary key,
  slug          text        not null,             -- 'guides/auth/users'  (route without base path)
  file_path     text        not null,             -- path relative to the content root
  page_title    text        not null default '',  -- the page's H1
  heading       text        not null default '',  -- this section's heading
  heading_level smallint    not null default 0,   -- 1..6, 0 = text before any heading
  heading_path  text[]      not null default '{}',-- ['Users', 'Permanent and anonymous users']
  content       text        not null default '',  -- plain text of the section body
  excerpt       text        not null default '',  -- first paragraph of the page
  updated_at    timestamptz not null default now(),

  -- Weighted search document, kept up to date by Postgres automatically.
  --   A = H1 (page title)
  --   B = H2
  --   C = H3
  --   D = H4+ headings and all body text
  -- ts_rank_cd() weights these A > B > C > D by default ({0.1, 0.2, 0.4, 1.0} for D, C, B, A).
  fts tsvector generated always as (
    setweight(to_tsvector('english', coalesce(page_title, '')), 'A')
    || setweight(
         to_tsvector('english', coalesce(heading, '')),
         (case heading_level when 1 then 'A' when 2 then 'B' when 3 then 'C' else 'D' end)::"char"
       )
    || setweight(to_tsvector('english', coalesce(content, '')), 'D')
  ) stored
);

create index if not exists docs_sections_fts_idx  on public.docs_sections using gin (fts);
create index if not exists docs_sections_slug_idx on public.docs_sections (slug);

-- Read-only access for anon/authenticated (the ingest script writes with the secret key, which bypasses RLS).
alter table public.docs_sections enable row level security;

drop policy if exists "docs_sections are publicly readable" on public.docs_sections;
create policy "docs_sections are publicly readable"
  on public.docs_sections for select
  to anon, authenticated
  using (true);

-- Search RPC: called from the server as supabase.rpc('search_docs', { query_text, match_limit }).
-- Score is ts_rank_cd normalised to 0..1 (normalization flag 32 => rank / (rank + 1)) and scaled to an
-- integer 0..1000 so the API can return a plain integer.
drop function if exists public.search_docs(text, int);

create or replace function public.search_docs(query_text text, match_limit int default 10)
returns table (
  slug         text,
  page_title   text,
  heading      text,
  heading_level smallint,
  heading_path text[],
  excerpt      text,
  score        int
)
language sql
stable
as $$
  with q as (
    select websearch_to_tsquery('english', query_text) as tsq
  ),
  ranked as (
    select
      d.slug,
      d.page_title,
      d.heading,
      d.heading_level,
      d.heading_path,
      d.excerpt,
      round(ts_rank_cd(d.fts, q.tsq, 32) * 1000)::int as score
    from public.docs_sections d, q
    where d.fts @@ q.tsq
  ),
  -- A page can have several matching sections; keep only its best-scoring one so the
  -- same route doesn't take up multiple slots in the results.
  best_per_page as (
    select distinct on (r.slug) r.*
    from ranked r
    order by r.slug, r.score desc, r.heading_level asc
  )
  select b.slug, b.page_title, b.heading, b.heading_level, b.heading_path, b.excerpt, b.score
  from best_per_page b
  order by b.score desc, b.heading_level asc, b.slug asc
  limit greatest(1, least(coalesce(match_limit, 10), 100));
$$;

grant execute on function public.search_docs(text, int) to anon, authenticated, service_role;
