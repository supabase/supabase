CREATE OR REPLACE FUNCTION public.docs_search_fts (
  query text
)
  RETURNS TABLE (
    id          bigint,
    path        text,
    type        text,
    title       text,
    subtitle    text,
    description text
  )
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
#variable_conflict use_variable
begin
  return query
  select
	page.id,
	page.path,
	page.type,
	page.meta ->> 'title' as title,
	page.meta ->> 'subtitle' as subtitle,
	page.meta ->> 'description' as description
  from public.page
  where title_tokens @@ websearch_to_tsquery(query) or fts_tokens @@ websearch_to_tsquery(query)
  order by greatest(
	  -- Title is more important than body, so use 10 as the weighting factor
	  -- Cut off at max rank of 1
	  least(10 * ts_rank(title_tokens, websearch_to_tsquery(query)), 1),
	  ts_rank(fts_tokens, websearch_to_tsquery(query))
  ) desc
  limit 10;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."docs_search_fts"(text) TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."docs_search_fts"(text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."docs_search_fts"(text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."docs_search_fts"(text) TO "postgres";
