-- remove unused column

alter table page
drop column parent_page_id;

-- move indexed content for fts search from page_section to page
-- this should allow better rankings as it gives a better overview of
-- search term frequency on that page

drop index fts_search_index;

alter table page_section
drop column fts_tokens;

alter table page
add column content text;

alter table page
add column fts_tokens tsvector generated always as (to_tsvector('english', content)) stored;

create index fts_search_index_page on page using gin(fts_tokens);

-- also search against the page title if it exists, to give more
-- intuitive search rankings

alter table page

add column title_tokens tsvector generated always as (to_tsvector('english', coalesce(meta ->> 'title', ''))) stored;

create index fts_search_index_title on page using gin(title_tokens);

-- rank search by best match (title matches tend to rank better than content matches
-- due to underlying ts_rank algorithm

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
	  page.meta ->> 'subtitle' as subtitle,
	  page.meta ->> 'description' as description
	from page
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
