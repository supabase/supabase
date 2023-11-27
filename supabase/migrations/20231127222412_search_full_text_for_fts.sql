alter table page
add column content text;

alter table page
add column fts_tokens tsvector generated always as (to_tsvector('english', content)) stored;

create index fts_search_index_page on page using gin(fts_tokens);

drop function docs_search_fts;

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
as $$
#variable_conflict use_variable
begin
	return query
	select
		page.id,
		page.path,
		page.type,
		page.meta ->> 'title' as title,
		page.meta ->> 'subtitle' as title,
		page.meta ->> 'description' as description
	from page
	where fts_tokens @@ websearch_to_tsquery(query)
	limit 10;
end;
$$;
