import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getMigrationsSql = (): SafeSqlFragment => {
  // The migrations table only exists once a migration has been applied (e.g. via
  // the CLI or the dashboard). Guarding the select inside a PL/pgSQL block (behind
  // a to_regclass check) defers planning of the table reference, so this returns
  // zero rows instead of erroring with 42P01 (undefined_table) when the table is
  // absent. query_to_xml is deliberately avoided: it is forbidden through
  // Multigres's connection pooler.
  //
  // The do-block stashes the result in a transaction-local GUC (set_config with
  // is_local = true) and the trailing select reads it back. pg-meta sends this
  // whole string as a single simple-protocol query, which Postgres executes in one
  // implicit transaction, so the GUC is visible to the select and reverts once the
  // query finishes (nothing leaks into pooled connections).
  //
  // Rows are serialized with to_jsonb so the query also tolerates older tables
  // that only have a `version` column (no `name`/`statements`).
  const sql = safeSql`
    do $$
    declare
      migrations text;
    begin
      if pg_catalog.to_regclass('supabase_migrations.schema_migrations') is not null then
        select coalesce(
          pg_catalog.jsonb_agg(pg_catalog.to_jsonb(sm) order by sm.version desc),
          '[]'::pg_catalog.jsonb
        )::text
        into migrations
        from supabase_migrations.schema_migrations sm;
      else
        migrations := '[]';
      end if;
      perform pg_catalog.set_config('supabase.studio_migrations', migrations, true);
    end $$;
    select
      m->>'version' as version,
      m->>'name' as name,
      case
        when pg_catalog.jsonb_typeof(m->'statements') = 'array'
        then array(select pg_catalog.jsonb_array_elements_text(m->'statements'))
        else null
      end as statements
    from pg_catalog.jsonb_array_elements(
      coalesce(
        nullif(pg_catalog.current_setting('supabase.studio_migrations', true), '')::pg_catalog.jsonb,
        '[]'::pg_catalog.jsonb
      )
    ) as m
    order by m->>'version' desc
  `

  return sql
}

export const getCreateMigrationsTableSQL = (): SafeSqlFragment => {
  return safeSql`
    create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations (
      version text not null primary key,
      statements text[],
      name text
    );
  `
}

export const getInsertMigrationSQL = ({
  name,
  version,
  statements,
}: {
  name: string
  version: string
  statements: string
}): SafeSqlFragment => {
  return safeSql`
    insert into supabase_migrations.schema_migrations (version, statements, name)
    select ${literal(version)}, array_agg(jsonb_statements)::text[], ${literal(name)}
    from jsonb_array_elements_text(${literal(statements)}) as jsonb_statements;
  `
}
