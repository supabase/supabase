import { ident, literal } from '../../../pg-format'
import pgMetaExtensions from '../../../pg-meta-extensions'

export const getDatabaseExtensionDefaultSchemaSQL = ({ extension }: { extension: string }) => {
  const sql = /* SQL */ `
select name, version, schema from pg_available_extension_versions where name = ${literal(extension)} limit 1;
`.trim()

  return sql
}

export const getEnableDatabaseExtensionSQL = ({
  schema,
  name,
  version,
  cascade,
  createSchema = false,
}: {
  schema: string
  name: string
  version: string
  cascade?: boolean
  createSchema?: boolean
}) => {
  const { sql } = pgMetaExtensions.create({ schema, name, version, cascade })
  return createSchema
    ? `
CREATE SCHEMA IF NOT EXISTS ${ident(schema)};
${sql}
`.trim()
    : sql.trim()
}
