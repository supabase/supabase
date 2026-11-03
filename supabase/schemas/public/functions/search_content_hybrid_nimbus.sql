CREATE OR REPLACE FUNCTION public.search_content_hybrid_nimbus (
  query_text           text,
  query_embedding      public.vector,
  max_result           integer          DEFAULT 30,
  full_text_weight     double precision DEFAULT 1,
  semantic_weight      double precision DEFAULT 1,
  rrf_k                integer          DEFAULT 50,
  match_threshold      double precision DEFAULT 0.78,
  include_full_content boolean          DEFAULT false
)
  RETURNS TABLE (
    id          bigint,
    page_title  text,
    type        text,
    href        text,
    content     text,
    metadata    json,
    subsections json[]
  )
  LANGUAGE sql
  SET search_path TO ''
  AS $function$
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
$function$;

GRANT EXECUTE
  ON FUNCTION "public"."search_content_hybrid_nimbus"(text, public.vector, integer, double precision, double precision, integer, double precision, boolean)
  TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE
  ON FUNCTION "public"."search_content_hybrid_nimbus"(text, public.vector, integer, double precision, double precision, integer, double precision, boolean)
  TO "service_role";

REVOKE ALL ON FUNCTION "public"."search_content_hybrid_nimbus"(text, public.vector, integer, double precision, double precision, integer, double precision, boolean) FROM "postgres";

GRANT EXECUTE
  ON FUNCTION "public"."search_content_hybrid_nimbus"(text, public.vector, integer, double precision, double precision, integer, double precision, boolean)
  TO "postgres";
