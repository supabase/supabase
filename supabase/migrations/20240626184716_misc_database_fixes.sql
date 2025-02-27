alter function public.update_last_changed_checksum
set search_path = '';

alter function public.cleanup_last_changed_pages
set search_path = '';

-- Return a setof page_section so that we can use PostgREST resource embeddings (joins with other tables)
create or replace function match_page_sections_v2(
  embedding vector(1536),
  match_threshold float,
  min_content_length int
)
returns setof page_section
language plpgsql
set search_path = ''
as $$
#variable_conflict use_variable
begin
  return query
  select *
  from public.page_section

  -- We only care about sections that have a useful amount of content
  where length(page_section.content) >= min_content_length

  -- The dot product is negative because of a Postgres limitation, so we negate it
  and (page_section.embedding operator(public.<#>) embedding) * -1 > match_threshold

  -- OpenAI embeddings are normalized to length 1, so
  -- cosine similarity and dot product will produce the same results.
  -- Using dot product which can be computed slightly faster.
  --
  -- For the different syntaxes, see https://github.com/pgvector/pgvector
  order by page_section.embedding operator(public.<#>) embedding;
end;
$$;

create or replace function ipv6_active_status (
  project_ref text
)
returns table (
  pgbouncer_active boolean,
  vercel_active boolean
)
set search_path = '' 
as $$
declare
  pgbouncer_active boolean;
  vercel_active boolean;
begin
  select exists (
    select 1 
    from public.active_pgbouncer_projects ap
    where ap.project_ref = $1
  ) into pgbouncer_active;

  select exists (
    select 1
    from public.vercel_project_connections_without_supavisor vp
    where vp.project_ref = $1
  ) into vercel_active;

  return query select pgbouncer_active, vercel_active;
end;
$$ language plpgsql security definer;

create or replace function docs_search_embeddings(
  embedding vector(1536),
  match_threshold float
)
returns table (
  id int8,
  path text,
  type text,
  title text,
  subtitle text,
  description text,
  headings text[],
  slugs text[]
)
language plpgsql
set search_path = ''
as $$
#variable_conflict use_variable
begin
  return query
  with match as(
	select *
	from public.page_section
	-- The dot product is negative because of a Postgres limitation, so we negate it
	where (page_section.embedding operator(public.<#>) embedding) * -1 > match_threshold	
	-- OpenAI embeddings are normalized to length 1, so
	-- cosine similarity and dot product will produce the same results.
	-- Using dot product which can be computed slightly faster.
	--
	-- For the different syntaxes, see https://github.com/pgvector/pgvector
	order by page_section.embedding operator(public.<#>) embedding
	limit 10
  )
  select
	page.id,
	page.path,
	page.type,
	page.meta ->> 'title' as title,
	page.meta ->> 'subtitle' as title,
	page.meta ->> 'description' as description,
	array_agg(match.heading) as headings,
	array_agg(match.slug) as slugs
  from public.page
  join match on match.page_id = page.id
  group by page.id;
end;
$$;

create or replace function docs_search_fts(query text)
returns table (
  id int8,
  path text,
  type text,
  title text,
  subtitle text,
  description text
)
language plpgsql
set search_path = ''
as $$
#variable_conflict use_variable
begin
  return query
  select
	page.id,
	page.path,
	page.type,
	page.meta ->> 'title' as title,
	page.meta ->> 'subtitle' as subtitle,
	page.meta ->> 'description' as description
  from public.page
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

drop function public.match_page_sections;

drop function public.get_page_parents;