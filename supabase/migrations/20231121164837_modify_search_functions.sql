alter table page_section
add column fts_tokens tsvector generated always as (to_tsvector('english', content)) stored;

create index fts_search_index on page_section using gin(fts_tokens);

create or replace function docs_search_fts(query text)
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
as $$
#variable_conflict use_variable
begin
	return query
	with match as (
		select *
		from page_section
		where fts_tokens @@ websearch_to_tsquery(query)
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
	from page
	join match on match.page_id = page.id
	group by page.id;
end;
$$;

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
as $$
#variable_conflict use_variable
begin
	return query
	with match as(
		select *
		from page_section
		-- The dot product is negative because of a Postgres limitation, so we negate it
		where (page_section.embedding <#> embedding) * -1 > match_threshold	
		-- OpenAI embeddings are normalized to length 1, so
		-- cosine similarity and dot product will produce the same results.
		-- Using dot product which can be computed slightly faster.
		--
		-- For the different syntaxes, see https://github.com/pgvector/pgvector
		order by page_section.embedding <#> embedding
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
	from page
	join match on match.page_id = page.id
	group by page.id;
end;
$$;
