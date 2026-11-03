CREATE OR REPLACE FUNCTION public.docs_search_embeddings_nimbus (
  embedding       public.vector,
  match_threshold double precision
)
  RETURNS TABLE (
    id          bigint,
    path        text,
    type        text,
    title       text,
    subtitle    text,
    description text,
    headings    text[],
    slugs       text[]
  )
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
#variable_conflict use_variable
begin
  return query
  with match as(
	select *
	from public.page_section_nimbus
	-- The dot product is negative because of a Postgres limitation, so we negate it
	where (page_section_nimbus.embedding operator(public.<#>) embedding) * -1 > match_threshold	
	-- OpenAI embeddings are normalized to length 1, so
	-- cosine similarity and dot product will produce the same results.
	-- Using dot product which can be computed slightly faster.
	--
	-- For the different syntaxes, see https://github.com/pgvector/pgvector
	order by page_section_nimbus.embedding operator(public.<#>) embedding
	limit 10
  )
  select
	page_nimbus.id,
	page_nimbus.path,
	page_nimbus.type,
	page_nimbus.meta ->> 'title' as title,
	page_nimbus.meta ->> 'subtitle' as title,
	page_nimbus.meta ->> 'description' as description,
	array_agg(match.heading) as headings,
	array_agg(match.slug) as slugs
  from public.page_nimbus
  join match on match.page_id = page_nimbus.id
  group by page_nimbus.id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."docs_search_embeddings_nimbus"(public.vector, double precision) TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."docs_search_embeddings_nimbus"(public.vector, double precision) TO "service_role";

REVOKE ALL ON FUNCTION "public"."docs_search_embeddings_nimbus"(public.vector, double precision) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."docs_search_embeddings_nimbus"(public.vector, double precision) TO "postgres";
