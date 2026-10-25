CREATE OR REPLACE FUNCTION public.update_troubleshooting_entry_date_updated()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  AS $function$
begin
    new.date_updated = now();
    return new;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."update_troubleshooting_entry_date_updated"() TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."update_troubleshooting_entry_date_updated"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."update_troubleshooting_entry_date_updated"() FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."update_troubleshooting_entry_date_updated"() TO "postgres";
