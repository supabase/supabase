export const getMigrationsSql = () => {
  const sql = /* SQL */ `
    select
      *
    from supabase_migrations.schema_migrations sm
    order by sm.version desc
  `.trim()

  return sql
}

export const getCreateMigrationsTableSQL = () => {
  return /* SQL */ `
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
    insert into supabase_migrations.schema_migrations (version, statements, name)
    select '${version}', array_agg(jsonb_statements)::text[], '${name}'
    from jsonb_array_elements_text($statements$${statements}$statements$::jsonb) as jsonb_statements;
  `
}
