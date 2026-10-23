CREATE OR REPLACE FUNCTION public.get_full_content_url (
  type text,
  path text,
  slug text
)
  RETURNS text
  LANGUAGE sql
  SET search_path TO ''
  AS $function$
  select case
    when type = 'github-discussions'
      then path
    when type = 'partner-integration'
      then concat('https://supabase.com', path)
    else
      concat(
        'https://supabase.com/docs',
        path,
        case
          when slug is null
            then ''
          else
            concat('#', slug)
        end
      )
  end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."get_full_content_url"(text, text, text) TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."get_full_content_url"(text, text, text) TO "service_role";

REVOKE ALL ON FUNCTION "public"."get_full_content_url"(text, text, text) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."get_full_content_url"(text, text, text) TO "postgres";
