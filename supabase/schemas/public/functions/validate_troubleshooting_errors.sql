CREATE OR REPLACE FUNCTION public.validate_troubleshooting_errors (
  errors jsonb[]
)
  RETURNS boolean
  LANGUAGE plpgsql
  AS $function$
declare
    error jsonb;
begin
    if errors is null then
        return true;
    end if;

    foreach error in array errors
    loop
        if not jsonb_matches_schema(
            schema := '{
                "type": "object",
                "properties": {
                    "http_status_code": { "type": "number" },
                    "code": { "type": "string" },
                    "message": { "type": "string" }
                },
                "additionalProperties": false
            }',
            instance := error
        ) then
            return false;
        end if;
    end loop;

    return true;
end;
$function$;

GRANT EXECUTE ON FUNCTION "public"."validate_troubleshooting_errors"(jsonb[]) TO PUBLIC, "anon", "authenticated";

GRANT EXECUTE ON FUNCTION "public"."validate_troubleshooting_errors"(jsonb[]) TO "service_role";

REVOKE ALL ON FUNCTION "public"."validate_troubleshooting_errors"(jsonb[]) FROM "postgres";

GRANT EXECUTE ON FUNCTION "public"."validate_troubleshooting_errors"(jsonb[]) TO "postgres";
