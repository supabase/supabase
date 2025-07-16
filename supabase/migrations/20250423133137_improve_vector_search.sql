create or replace function match_embedding(
  embedding vector(1536),
  match_threshold float default 0.78,
  max_results int default 30
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
  where (page_section.embedding operator(public.<#>) embedding) <= -match_threshold
  order by page_section.embedding operator(public.<#>) embedding
  limit max_results;
end;
$$;

create or replace function get_full_content_url(
  type text,
  path text,
  slug text
)
returns text
language sql
set search_path = ''
as $$
  select case
    when type = 'github-discussions'
      then path
    when type = 'partner-integration'
      then concat('https://supabase.com', path)
    else
      concat(
        'https://supabase.com/docs',
        path,
        case
          when slug is null
            then ''
          else
            concat('#', slug)
        end
      )
  end;
$$;

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
