-- One row per markdown *section* (a heading + the text below it, up to the next heading).
create table public.docs_search_v2 (
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

create index docs_search_v2_fts_idx  on public.docs_search_v2 using gin (fts);
create index docs_search_v2_slug_idx on public.docs_search_v2 (slug);

-- Read-only access for anon/authenticated (the ingest script writes with the secret key, which bypasses RLS).
alter table public.docs_search_v2 enable row level security;

create policy "docs_search_v2 is publicly readable"
  on public.docs_search_v2 for select
  to anon, authenticated
  using (true);

-- Search RPC: called from the server as supabase.rpc('docs_search_v2', { query_text, match_limit }).
-- Score is ts_rank_cd normalised to 0..1 (normalization flag 32 => rank / (rank + 1)) and scaled to an
-- integer 0..1000 so the API can return a plain integer.
create function public.docs_search_v2(query_text text, match_limit int default 10)
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
    from public.docs_search_v2 d, q
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

grant execute on function public.docs_search_v2(text, int) to anon, authenticated, service_role;
