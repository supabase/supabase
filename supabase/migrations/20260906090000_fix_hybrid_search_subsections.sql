-- Keep hybrid search subsection payloads limited to the sections that matched
-- either the full-text or semantic branch.
create or replace function search_content_hybrid(
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
  from public.page
  where title_tokens @@ websearch_to_tsquery(query_text) or fts_tokens @@ websearch_to_tsquery(query_text)
  order by rank_ix
  limit least(max_result, 30) * 2
),
semantic as (
  select
    id as section_id,
    page_id as id,
    row_number() over () as rank_ix
  from public.match_embedding(query_embedding, match_threshold, max_result * 2)
),
rrf as (
  select
    coalesce(full_text.id, semantic.id) as id,
    semantic.section_id,
    coalesce(1.0 / (rrf_k + full_text.rank_ix), 0.0) * full_text_weight +
    coalesce(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight as rrf_score
  from full_text
  full outer join semantic on full_text.id = semantic.id
),
ranked_page as (
  select
    id,
    max(rrf_score) as rrf_score
  from rrf
  where rrf_score > 0
  group by id
  order by max(rrf_score) desc
  limit max_result
),
matched_section as (
  select distinct on (page_section.id)
    page_section.id,
    page_section.page_id,
    page_section.heading,
    page_section.slug,
    page_section.content
  from ranked_page
  join public.page_section on page_section.page_id = ranked_page.id
  left join rrf on rrf.id = ranked_page.id
  where
    rrf.section_id = page_section.id
    or to_tsvector(
      'english',
      concat_ws(' ', page_section.heading, page_section.content)
    ) @@ websearch_to_tsquery(query_text)
  order by page_section.id
)
select
  page.id,
  page.meta ->> 'title' as page_title,
  page.type,
  public.get_full_content_url(page.type, page.path, null) as href,
  case when include_full_content then page.content else null end as content,
  page.meta as metadata,
  array_agg(json_build_object(
    'title', matched_section.heading,
    'href', public.get_full_content_url(page.type, page.path, matched_section.slug),
    'content', matched_section.content
  )) filter (where matched_section.id is not null) as subsections
from ranked_page
join public.page on page.id = ranked_page.id
left join matched_section on matched_section.page_id = page.id
group by page.id, ranked_page.rrf_score
order by ranked_page.rrf_score desc;
$$;

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
    id as section_id,
    page_id as id,
    row_number() over () as rank_ix
  from public.match_embedding_nimbus(query_embedding, match_threshold, max_result * 2)
),
rrf as (
  select
    coalesce(full_text.id, semantic.id) as id,
    semantic.section_id,
    coalesce(1.0 / (rrf_k + full_text.rank_ix), 0.0) * full_text_weight +
    coalesce(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight as rrf_score
  from full_text
  full outer join semantic on full_text.id = semantic.id
),
ranked_page as (
  select
    id,
    max(rrf_score) as rrf_score
  from rrf
  where rrf_score > 0
  group by id
  order by max(rrf_score) desc
  limit max_result
),
matched_section as (
  select distinct on (page_section_nimbus.id)
    page_section_nimbus.id,
    page_section_nimbus.page_id,
    page_section_nimbus.heading,
    page_section_nimbus.slug,
    page_section_nimbus.content
  from ranked_page
  join public.page_section_nimbus on page_section_nimbus.page_id = ranked_page.id
  left join rrf on rrf.id = ranked_page.id
  where
    rrf.section_id = page_section_nimbus.id
    or to_tsvector(
      'english',
      concat_ws(' ', page_section_nimbus.heading, page_section_nimbus.content)
    ) @@ websearch_to_tsquery(query_text)
  order by page_section_nimbus.id
)
select
  page_nimbus.id,
  page_nimbus.meta ->> 'title' as page_title,
  page_nimbus.type,
  public.get_full_content_url(page_nimbus.type, page_nimbus.path, null) as href,
  case when include_full_content then page_nimbus.content else null end as content,
  page_nimbus.meta as metadata,
  array_agg(json_build_object(
    'title', matched_section.heading,
    'href', public.get_full_content_url(page_nimbus.type, page_nimbus.path, matched_section.slug),
    'content', matched_section.content
  )) filter (where matched_section.id is not null) as subsections
from ranked_page
join public.page_nimbus on page_nimbus.id = ranked_page.id
left join matched_section on matched_section.page_id = page_nimbus.id
group by page_nimbus.id, ranked_page.rrf_score
order by ranked_page.rrf_score desc;
$$;
