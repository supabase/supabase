CREATE OR REPLACE FUNCTION public.get_last_revalidation_for_tags (
  tags text[]
)
  RETURNS TABLE (
    tag        text,
    created_at timestamp with time zone
  )
  LANGUAGE sql
  AS $function$
  select
    tag,
    max(created_at) as created_at
  from validation_history
  where tag = any(tags)
  group by tag;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_last_revalidation_for_tags"(text[]) TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."get_last_revalidation_for_tags"(text[]) TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_last_revalidation_for_tags"(text[]) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_last_revalidation_for_tags"(text[]) TO "postgres";
