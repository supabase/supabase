import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getMigrationsSql = (): SafeSqlFragment => {
  // The migrations table only exists once a migration has been applied (e.g. via
  // the CLI or the dashboard). Guard with to_regclass + query_to_xml so this query
  // returns zero rows instead of erroring with 42P01 (undefined_table).
  // Rows are serialized with to_jsonb so the query also tolerates older tables
  // that only have a `version` column (no `name`/`statements`).
  const sql = safeSql`
    with rows as (
      select xt.row_json::jsonb as row_data
      from xmltable(
        '/table/row'
        passing (
          case
            when pg_catalog.to_regclass('supabase_migrations.schema_migrations') is not null
            then pg_catalog.query_to_xml(
              'select to_jsonb(sm)::text as row_json from supabase_migrations.schema_migrations sm',
              false,
              false,
              ''
            )
            else '<table/>'::xml
          end
        )
        columns row_json text path 'row_json'
      ) xt
    )
    select
      rows.row_data->>'version' as version,
      rows.row_data->>'name' as name,
      case
        when jsonb_typeof(rows.row_data->'statements') = 'array'
        then array(select jsonb_array_elements_text(rows.row_data->'statements'))
        else null
      end as statements
    from rows
    order by rows.row_data->>'version' desc
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
