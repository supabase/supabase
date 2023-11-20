alter table page_section
add column fts_tokens tsvector generated always as (to_tsvector('english', content)) stored;

create index fts_search_index on page_section using gin(fts_tokens);

create or replace function docs_full_text_search(query text)
returns table (path text, title text, subtitle text, description text, slugs text[])
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
		page.path,
		page.meta ->> 'title' as title,
		page.meta ->> 'subtitle' as title,
		page.meta ->> 'description' as description,
		array_agg(match.slug) as slugs
	from page
	join match on match.page_id = page.id
	group by page.id;
end;
$$
