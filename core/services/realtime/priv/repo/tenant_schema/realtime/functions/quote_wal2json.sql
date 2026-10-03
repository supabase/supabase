create or replace function realtime.quote_wal2json (
  entity regclass
)
  returns text
  language sql
  immutable
  strict
  AS $function$
  SELECT
    realtime.wal2json_escape_identifier(nsp.nspname::text)
    || '.'
    || realtime.wal2json_escape_identifier(pc.relname::text)
  FROM pg_class pc
  JOIN pg_namespace nsp ON pc.relnamespace = nsp.oid
  WHERE pc.oid = entity
$function$;

alter function "realtime"."quote_wal2json"(regclass) owner to "supabase_realtime_admin";

grant execute on function "realtime"."quote_wal2json"(regclass) to "anon", "authenticated", "service_role";
