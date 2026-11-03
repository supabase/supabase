CREATE OR REPLACE FUNCTION public.search_content_nimbus (
  embedding            public.vector,
  include_full_content boolean          DEFAULT false,
  match_threshold      double precision DEFAULT 0.78,
  max_result           integer          DEFAULT 30
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
  with matched_section as (
    select
      *,
      row_number() over () as ranking
    from public.match_embedding_nimbus(
      embedding,
      match_threshold,
      max_result
    )
  )
  select
    page_nimbus.id,
    meta ->> 'title' as page_title,
    type,
    public.get_full_content_url(type, path, null) as href,
    case
      when include_full_content
        then page_nimbus.content
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
  join public.page_nimbus on matched_section.page_id = page_nimbus.id
  group by page_nimbus.id
  order by min(ranking);
$function$;

GRANT EXECUTE ON FUNCTION "public"."search_content_nimbus"(public.vector, boolean, double precision, integer) TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."search_content_nimbus"(public.vector, boolean, double precision, integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."search_content_nimbus"(public.vector, boolean, double precision, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."search_content_nimbus"(public.vector, boolean, double precision, integer) TO "postgres";
