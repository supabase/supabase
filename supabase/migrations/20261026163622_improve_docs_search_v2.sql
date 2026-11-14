-- Improve docs_search_v2 recall: partial words ("edg", "edge fun"), OR matching and typo tolerance.
-- Same name, arguments and return columns as before, so the API route and client are unchanged.

create extension if not exists pg_trgm with schema extensions;

create index docs_search_v2_page_title_trgm_idx
  on public.docs_search_v2 using gin (page_title extensions.gin_trgm_ops);
create index docs_search_v2_heading_trgm_idx
  on public.docs_search_v2 using gin (heading extensions.gin_trgm_ops);

-- Search RPC: called from the server as supabase.rpc('docs_search_v2', { query_text, match_limit }).
-- Matches are tiered, and score bands keep a better tier above every match of a lower tier:
--   strict   (3000-3999)  every term is a whole word (websearch_to_tsquery)
--   prefix   (2000-2999)  every term is the start of a word ("edge fun" => "edge functions")
--   or       (1000-1999)  any term matches, only when strict and prefix return nothing
--   trigram  (0-899)      typo-tolerant match on page title or heading, only when all of the above
--                         return nothing
-- Within a tier the score is ts_rank_cd normalised to 0..1 (normalization flag 32 => rank / (rank + 1)).
create or replace function public.docs_search_v2(query_text text, match_limit int default 10)
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
-- Minimum similarity for the trigram tier (pg_trgm default is 0.6).
set pg_trgm.word_similarity_threshold = '0.4'
as $$
  with words as (
    -- Lowercase alphanumeric words only, so the terms are safe to put in a tsquery.
    select w
    from regexp_split_to_table(
      lower(regexp_replace(coalesce(query_text, ''), '[^[:alnum:]]+', ' ', 'g')),
      '\s+'
    ) as w
    where w <> ''
  ),
  q as (
    select
      websearch_to_tsquery('english', query_text) as strict_q,
      -- English stop words ("how", "to", "the") are dropped when the query is parsed.
      to_tsquery('english', (select string_agg(w || ':*', ' & ') from words)) as prefix_q,
      to_tsquery('english', (select string_agg(w || ':*', ' | ') from words)) as or_q
  ),
  strict_hits as (
    select
      d.slug, d.page_title, d.heading, d.heading_level, d.heading_path, d.excerpt,
      3000 + round(ts_rank_cd(d.fts, q.strict_q, 32) * 999)::int as score
    from public.docs_search_v2 d, q
    where d.fts @@ q.strict_q
  ),
  prefix_hits as (
    select
      d.slug, d.page_title, d.heading, d.heading_level, d.heading_path, d.excerpt,
      2000 + round(ts_rank_cd(d.fts, q.prefix_q, 32) * 999)::int as score
    from public.docs_search_v2 d, q
    where d.fts @@ q.prefix_q
  ),
  primary_hits as (
    select * from strict_hits
    union all
    select * from prefix_hits
  ),
  or_hits as (
    select
      d.slug, d.page_title, d.heading, d.heading_level, d.heading_path, d.excerpt,
      1000 + round(ts_rank_cd(d.fts, q.or_q, 32) * 999)::int as score
    from public.docs_search_v2 d, q
    where d.fts @@ q.or_q
      and not exists (select 1 from primary_hits)
  ),
  trigram_hits as (
    select
      d.slug, d.page_title, d.heading, d.heading_level, d.heading_path, d.excerpt,
      round(
        greatest(
          extensions.word_similarity(query_text, d.page_title),
          extensions.word_similarity(query_text, d.heading)
        ) * 899
      )::int as score
    from public.docs_search_v2 d
    where (
        query_text operator(extensions.<%) d.page_title
        or query_text operator(extensions.<%) d.heading
      )
      and not exists (select 1 from primary_hits)
      and not exists (select 1 from or_hits)
  ),
  ranked as (
    select * from primary_hits
    union all
    select * from or_hits
    union all
    select * from trigram_hits
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
