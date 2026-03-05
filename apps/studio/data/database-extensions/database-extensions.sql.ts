import { literal } from '@supabase/pg-meta/src/pg-format'

export const getDatabaseExtensionDefaultSchemaSQL = ({ extension }: { extension: string }) => {
  const sql = /* SQL */ `
select name, version, schema from pg_available_extension_versions where name = ${literal(extension)} limit 1;
`.trim()

  return sql
}
