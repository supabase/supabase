import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getMigrationsSql = (): SafeSqlFragment => {
  const sql = safeSql`
    select
      *
    from supabase_migrations.schema_migrations sm
    order by sm.version desc
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
