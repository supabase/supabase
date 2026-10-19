CREATE OR REPLACE FUNCTION public.match_embedding_nimbus (
  embedding       public.vector,
  match_threshold double precision DEFAULT 0.78,
  max_results     integer          DEFAULT 30
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
  where (page_section_nimbus.embedding operator(public.<#>) embedding) <= -match_threshold
  order by page_section_nimbus.embedding operator(public.<#>) embedding
  limit max_results;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."match_embedding_nimbus"(public.vector, double precision, integer) TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."match_embedding_nimbus"(public.vector, double precision, integer) TO "service_role";

REVOKE ALL ON FUNCTION "public"."match_embedding_nimbus"(public.vector, double precision, integer) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."match_embedding_nimbus"(public.vector, double precision, integer) TO "postgres";
