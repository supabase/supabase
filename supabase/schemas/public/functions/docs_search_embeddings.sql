CREATE OR REPLACE FUNCTION public.docs_search_embeddings (
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
	from public.page_section
	-- The dot product is negative because of a Postgres limitation, so we negate it
	where (page_section.embedding operator(public.<#>) embedding) * -1 > match_threshold	
	-- OpenAI embeddings are normalized to length 1, so
	-- cosine similarity and dot product will produce the same results.
	-- Using dot product which can be computed slightly faster.
	--
	-- For the different syntaxes, see https://github.com/pgvector/pgvector
	order by page_section.embedding operator(public.<#>) embedding
	limit 10
  )
  select
	page.id,
	page.path,
	page.type,
	page.meta ->> 'title' as title,
	page.meta ->> 'subtitle' as title,
	page.meta ->> 'description' as description,
	array_agg(match.heading) as headings,
	array_agg(match.slug) as slugs
  from public.page
  join match on match.page_id = page.id
  group by page.id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."docs_search_embeddings"(public.vector, double precision) TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."docs_search_embeddings"(public.vector, double precision) TO "service_role";

REVOKE ALL ON FUNCTION "public"."docs_search_embeddings"(public.vector, double precision) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."docs_search_embeddings"(public.vector, double precision) TO "postgres";
