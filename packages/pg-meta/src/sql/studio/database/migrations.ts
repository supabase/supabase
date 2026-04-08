export const getMigrationsSql = () => {
  const sql = /* SQL */ `
-- source: dashboard
-- description: List all schema migrations ordered by version descending
    select
      *
    from supabase_migrations.schema_migrations sm
    order by sm.version desc
  `.trim()

  return sql
}

export const getCreateMigrationsTableSQL = () => {
  return /* SQL */ `
-- source: dashboard
-- description: Create the supabase_migrations schema and schema_migrations table if they do not exist
    create schema if not exists supabase_migrations;
    create table if not exists supabase_migrations.schema_migrations (
      version text not null primary key,
      statements text[],
      name text
    );
  `.trim()
}

export const getInsertMigrationSQL = ({
  name,
  version,
  statements,
}: {
  name: string
  version: string
  statements: string
}) => {
  return /* SQL */ `
-- source: dashboard
-- description: Insert a new migration record into the schema_migrations table
    insert into supabase_migrations.schema_migrations (version, statements, name)
    select '${version}', array_agg(jsonb_statements)::text[], '${name}'
    from jsonb_array_elements_text($statements$${statements}$statements$::jsonb) as jsonb_statements;
  `
}
