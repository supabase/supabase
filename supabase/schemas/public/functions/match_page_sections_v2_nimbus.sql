CREATE OR REPLACE FUNCTION public.match_page_sections_v2_nimbus (
  embedding          public.vector,
  match_threshold    double precision,
  min_content_length integer
)
  RETURNS SETOF public.page_section_nimbus
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
#variable_conflict use_variable
begin
  return query
  select *
  from public.page_section_nimbus

  -- We only care about sections that have a useful amount of content
  where length(page_section_nimbus.content) >= min_content_length

  -- The dot product is negative because of a Postgres limitation, so we negate it
  and (page_section_nimbus.embedding operator(public.<#>) embedding) * -1 > match_threshold

  -- OpenAI embeddings are normalized to length 1, so
  -- cosine similarity and dot product will produce the same results.
  -- Using dot product which can be computed slightly faster.
  --
  -- For the different syntaxes, see https://github.com/pgvector/pgvector
  order by page_section_nimbus.embedding operator(public.<#>) embedding;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."match_page_sections_v2_nimbus"(public.vector, double precision, integer) TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."match_page_sections_v2_nimbus"(public.vector, double precision, integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."match_page_sections_v2_nimbus"(public.vector, double precision, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."match_page_sections_v2_nimbus"(public.vector, double precision, integer) TO "postgres";
