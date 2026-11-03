CREATE OR REPLACE FUNCTION public.cleanup_last_changed_pages()
  RETURNS integer
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
declare
  newest_check_time timestamp with time zone;
  number_deleted integer;
begin
  select last_checked into newest_check_time
    from public.last_changed
    order by last_checked desc
    limit 1
  ;

  with deleted as (
    delete from public.last_changed
    where last_checked <> newest_check_time
    returning id
  )
  select count(*)
  from deleted
  into number_deleted;

  return number_deleted;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."cleanup_last_changed_pages"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."cleanup_last_changed_pages"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."cleanup_last_changed_pages"() TO "postgres";

REVOKE ALL ON FUNCTION "public"."cleanup_last_changed_pages"() FROM PUBLIC, "anon", "authenticated";
