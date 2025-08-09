-- Hybrid search: combines FTS and vector search using reciprocal rank fusion (RRF)
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
    page_id as id,
    row_number() over () as rank_ix
  from public.match_embedding(query_embedding, match_threshold, max_result * 2)
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
  page.id,
  page.meta ->> 'title' as page_title,
  page.type,
  public.get_full_content_url(page.type, page.path, null) as href,
  case when include_full_content then page.content else null end as content,
  page.meta as metadata,
  array_agg(json_build_object(
    'title', page_section.heading,
    'href', public.get_full_content_url(page.type, page.path, page_section.slug),
    'content', page_section.content
  )) as subsections
from rrf
join public.page on page.id = rrf.id
left join public.page_section on page_section.page_id = page.id
where rrf.rrf_score > 0
group by page.id
order by max(rrf.rrf_score) desc
limit max_result;
$$; 