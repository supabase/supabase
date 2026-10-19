CREATE OR REPLACE FUNCTION utils.update_timestamp()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
    new.updated_at = now();
    return new;
end;
$function$;

GRANT EXECUTE ON FUNCTION "utils"."update_timestamp"() TO "anon", "authenticated";
