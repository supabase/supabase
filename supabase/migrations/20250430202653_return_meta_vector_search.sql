-- Alter the search_content function to also return the page metadata

drop function search_content;

create or replace function search_content(
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
language sql
set search_path = ''
as $$
  with matched_section as (
    select
      *,
      row_number() over () as ranking
    from public.match_embedding(
      embedding,
      match_threshold,
      max_result
    )
  )
  select
    page.id,
    meta ->> 'title' as page_title,
    type,
    public.get_full_content_url(type, path, null) as href,
    case
      when include_full_content
        then page.content
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
  join public.page on matched_section.page_id = page.id
  group by page.id
  order by min(ranking);
$$;
