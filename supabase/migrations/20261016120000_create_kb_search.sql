create table public.kb_search (
  id bigint generated always as identity primary key,
  slug text not null,
  file_path text not null,
  page_title text not null default '',
  heading text not null default '',
  heading_level smallint not null default 0,
  heading_path text[] not null default '{}',
  content text not null default '',
  excerpt text not null default '',
  updated_at timestamptz not null default now(),
  fts tsvector generated always as (
    setweight(to_tsvector('english', coalesce(page_title, '')), 'A')
    || setweight(
      to_tsvector('english', coalesce(heading, '')),
      (case heading_level when 1 then 'A' when 2 then 'B' when 3 then 'C' else 'D' end)::"char"
    )
    || setweight(to_tsvector('english', coalesce(content, '')), 'D')
  ) stored
);

create index kb_search_fts_idx on public.kb_search using gin (fts);
create index kb_search_slug_idx on public.kb_search (slug);

alter table public.kb_search enable row level security;

grant select, insert, delete on public.kb_search to service_role;

create function public.search_kb(query_text text, match_limit int default 10)
returns table (
  slug text,
  page_title text,
  heading text,
  heading_level smallint,
  heading_path text[],
  excerpt text,
  score int
)
language sql
stable
set search_path = ''
as $$
  with terms as (
    select distinct
      to_tsquery('simple', quote_literal(lexeme)) as anywhere,
      to_tsquery('simple', quote_literal(lexeme) || ':AB') as in_title
    from unnest(tsvector_to_array(to_tsvector('english', query_text))) as lexeme
  ),
  weighted_terms as (
    select
      t.anywhere,
      t.in_title,
      greatest(0, ln(
        (select count(*) from public.kb_search)::float
        / (1 + (select count(*) from public.kb_search s where s.fts @@ t.anywhere))
      )) as idf
    from terms t
  ),
  ranked as (
    select
      s.slug,
      s.page_title,
      s.heading,
      s.heading_level,
      s.heading_path,
      s.excerpt,
      round(
        1000 * sum(w.idf * case when s.fts @@ w.in_title then 2 else 1 end)
        / nullif((select 2 * sum(idf) from weighted_terms), 0)
      )::int as score
    from public.kb_search s
    join weighted_terms w on s.fts @@ w.anywhere
    group by s.id
  ),
  best_per_page as (
    select distinct on (r.slug) r.*
    from ranked r
    where r.score >= 300
    order by r.slug, r.score desc, r.heading_level asc
  )
  select b.slug, b.page_title, b.heading, b.heading_level, b.heading_path, b.excerpt, b.score
  from best_per_page b
  order by b.score desc, b.heading_level asc, b.slug asc
  limit greatest(1, least(coalesce(match_limit, 10), 100));
$$;

revoke execute on function public.search_kb(text, int) from public, anon, authenticated;
grant execute on function public.search_kb(text, int) to service_role;
