create or replace function realtime.build_prepared_statement_sql (
  prepared_statement_name text,
  entity                  regclass,
  columns                 realtime.wal_column[]
)
  returns text
  language sql
  AS $function$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $function$;

alter function "realtime"."build_prepared_statement_sql"(text, regclass, realtime.wal_column[]) owner to "supabase_realtime_admin";

grant execute on function "realtime"."build_prepared_statement_sql"(text, regclass, realtime.wal_column[]) to "anon", "authenticated", "service_role";
