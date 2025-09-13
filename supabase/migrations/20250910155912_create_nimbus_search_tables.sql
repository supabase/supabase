-- Create nimbus tables for feature-flag-filtered search
-- These tables mirror the structure of page and page_section but contain only content
-- that should be visible when all feature flags are disabled

create table "public"."page_nimbus" (
  id bigint primary key generated always as identity,
  path text not null unique,
  checksum text,
  meta jsonb,
  type text,
  source text,
  content text,
  version uuid,
  last_refresh timestamptz,
  fts_tokens tsvector generated always as (to_tsvector('english', content)) stored,
  title_tokens tsvector generated always as (to_tsvector('english', coalesce(meta ->> 'title', ''))) stored
);

alter table "public"."page_nimbus"
enable row level security;

create policy "anon can read page_nimbus"
on public.page_nimbus
for select
to anon
using (true);

create policy "authenticated can read page_nimbus"
on public.page_nimbus
for select
to authenticated
using (true);

create table "public"."page_section_nimbus" (
  id bigint primary key generated always as identity,
  page_id bigint not null references public.page_nimbus (id) on delete cascade,
  content text,
  token_count int,
  embedding vector(1536),
  slug text,
  heading text,
  rag_ignore boolean default false
);

alter table "public"."page_section_nimbus"
enable row level security;

create policy "anon can read page_section_nimbus"
on public.page_section_nimbus
for select
to anon
using (true);

create policy "authenticated can read page_section_nimbus"
on public.page_section_nimbus
for select
to authenticated
using (true);

-- Create indexes for nimbus tables (matching the regular tables)
create index fts_search_index_content_nimbus
on page_nimbus
using gin(fts_tokens);

create index fts_search_index_title_nimbus
on page_nimbus
using gin(title_tokens);

-- Create search function for nimbus tables (FTS search)
create or replace function docs_search_fts_nimbus(query text)
returns table (
	id bigint,
	path text,
	type text,
	title text,
	subtitle text,
	description text
)
set search_path = ''
language plpgsql
as $$
#variable_conflict use_variable
begin
	return query
	select
	  page_nimbus.id,
	  page_nimbus.path,
	  page_nimbus.type,
	  page_nimbus.meta ->> 'title' as title,
	  page_nimbus.meta ->> 'subtitle' as subtitle,
	  page_nimbus.meta ->> 'description' as description
	from public.page_nimbus
	where title_tokens @@ websearch_to_tsquery(query) or fts_tokens @@ websearch_to_tsquery(query)
	order by greatest(
		-- Title is more important than body, so use 10 as the weighting factor
		-- Cut off at max rank of 1
		least(10 * ts_rank(title_tokens, websearch_to_tsquery(query)), 1),
		ts_rank(fts_tokens, websearch_to_tsquery(query))
	  ) desc
	limit 10;
end;
$$;

-- Create embedding matching function for nimbus tables
create or replace function match_embedding_nimbus(
  embedding vector(1536),
  match_threshold float default 0.78,
  max_results int default 30
)
returns setof public.page_section_nimbus
set search_path = ''
language plpgsql
as $$
#variable_conflict use_variable
begin
  return query
  select *
  from public.page_section_nimbus
  where (page_section_nimbus.embedding operator(public.<#>) embedding) <= -match_threshold
  order by page_section_nimbus.embedding operator(public.<#>) embedding
  limit max_results;
end;
$$;

-- Create hybrid search function for nimbus tables
create or replace function search_content_hybrid_nimbus(
  query_text text,
  query_embedding vector(1536),
  max_result int default 30,
  full_text_weight float default 1,
  semantic_weight float default 1,
  rrf_k int default 50,
  match_threshold float default 0.78,
  include_full_content boolean default false
)
returns table (
  id bigint,
  page_title text,
  type text,
  href text,
  content text,
  metadata json,
  subsections json[]
)
language sql
set search_path = ''
as $$
with full_text as (
  select
    id,
    row_number() over(order by greatest(
      least(10 * ts_rank(title_tokens, websearch_to_tsquery(query_text)), 1),
      ts_rank(fts_tokens, websearch_to_tsquery(query_text))
    ) desc) as rank_ix
  from public.page_nimbus
  where title_tokens @@ websearch_to_tsquery(query_text) or fts_tokens @@ websearch_to_tsquery(query_text)
  order by rank_ix
  limit least(max_result, 30) * 2
),
semantic as (
  select
    page_id as id,
    row_number() over () as rank_ix
  from public.match_embedding_nimbus(query_embedding, match_threshold, max_result * 2)
),
rrf as (
  select
    coalesce(full_text.id, semantic.id) as id,
    coalesce(1.0 / (rrf_k + full_text.rank_ix), 0.0) * full_text_weight +
    coalesce(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight as rrf_score
  from full_text
  full outer join semantic on full_text.id = semantic.id
)
select
  page_nimbus.id,
  page_nimbus.meta ->> 'title' as page_title,
  page_nimbus.type,
  public.get_full_content_url(page_nimbus.type, page_nimbus.path, null) as href,
  case when include_full_content then page_nimbus.content else null end as content,
  page_nimbus.meta as metadata,
  array_agg(json_build_object(
    'title', page_section_nimbus.heading,
    'href', public.get_full_content_url(page_nimbus.type, page_nimbus.path, page_section_nimbus.slug),
    'content', page_section_nimbus.content
  )) as subsections
from rrf
join public.page_nimbus on page_nimbus.id = rrf.id
left join public.page_section_nimbus on page_section_nimbus.page_id = page_nimbus.id
where rrf.rrf_score > 0
group by page_nimbus.id
order by max(rrf.rrf_score) desc
limit max_result;
$$;

create or replace function match_page_sections_v2_nimbus(
  embedding vector(1536),
  match_threshold float,
  min_content_length int
)
returns setof page_section_nimbus
set search_path = ''
language plpgsql
as $$
#variable_conflict use_variable
begin
  return query
  select *
  from public.page_section_nimbus

  -- We only care about sections that have a useful amount of content
  where length(page_section_nimbus.content) >= min_content_length

  -- The dot product is negative because of a Postgres limitation, so we negate it
  and (page_section_nimbus.embedding operator(public.<#>) embedding) * -1 > match_threshold

  -- OpenAI embeddings are normalized to length 1, so
  -- cosine similarity and dot product will produce the same results.
  -- Using dot product which can be computed slightly faster.
  --
  -- For the different syntaxes, see https://github.com/pgvector/pgvector
  order by page_section_nimbus.embedding operator(public.<#>) embedding;
end;
$$;

create or replace function docs_search_embeddings_nimbus(
  embedding vector(1536),
  match_threshold float
)
returns table (
  id bigint,
  path text,
  type text,
  title text,
  subtitle text,
  description text,
  headings text[],
  slugs text[]
)
set search_path = ''
language plpgsql
as $$
#variable_conflict use_variable
begin
  return query
  with match as(
	select *
	from public.page_section_nimbus
	-- The dot product is negative because of a Postgres limitation, so we negate it
	where (page_section_nimbus.embedding operator(public.<#>) embedding) * -1 > match_threshold	
	-- OpenAI embeddings are normalized to length 1, so
	-- cosine similarity and dot product will produce the same results.
	-- Using dot product which can be computed slightly faster.
	--
	-- For the different syntaxes, see https://github.com/pgvector/pgvector
	order by page_section_nimbus.embedding operator(public.<#>) embedding
	limit 10
  )
  select
	page_nimbus.id,
	page_nimbus.path,
	page_nimbus.type,
	page_nimbus.meta ->> 'title' as title,
	page_nimbus.meta ->> 'subtitle' as title,
	page_nimbus.meta ->> 'description' as description,
	array_agg(match.heading) as headings,
	array_agg(match.slug) as slugs
  from public.page_nimbus
  join match on match.page_id = page_nimbus.id
  group by page_nimbus.id;
end;
$$;

create or replace function search_content_nimbus(
  embedding vector(1536),
  include_full_content boolean default false,
  match_threshold float default 0.78,
  max_result int default 30
)
returns table (
  id bigint,
  page_title text,
  type text,
  href text,
  content text,
  metadata json,
  subsections json[]
)
set search_path = ''
language sql
as $$
  with matched_section as (
    select
      *,
      row_number() over () as ranking
    from public.match_embedding_nimbus(
      embedding,
      match_threshold,
      max_result
    )
  )
  select
    page_nimbus.id,
    meta ->> 'title' as page_title,
    type,
    public.get_full_content_url(type, path, null) as href,
    case
      when include_full_content
        then page_nimbus.content
      else
        null
    end as content,
    meta as metadata,
    array_agg(
      json_build_object(
        'title', heading,
        'href', public.get_full_content_url(type, path, slug),
        'content', matched_section.content
      )
    )
  from matched_section
  join public.page_nimbus on matched_section.page_id = page_nimbus.id
  group by page_nimbus.id
  order by min(ranking);
$$;

