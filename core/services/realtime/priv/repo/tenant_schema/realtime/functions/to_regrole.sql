create or replace function realtime.to_regrole (
  role_name text
)
  returns regrole
  language sql
  immutable
  AS $function$ select role_name::regrole $function$;

alter function "realtime"."to_regrole"(text) owner to "supabase_realtime_admin";

grant execute on function "realtime"."to_regrole"(text) to "anon", "authenticated", "service_role";
