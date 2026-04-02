import { ident } from '../../../pg-format'
import pgMetaExtensions from '../../../pg-meta-extensions'

export const getDatabaseExtensionsSQL = () =>
  `
SELECT
  e.name,
  n.nspname AS schema,
  e.default_version,
  x.extversion AS installed_version,
  e.comment,
  ev.schema AS default_version_schema
FROM
  pg_available_extensions e
  LEFT JOIN pg_extension x ON e.name = x.extname
  LEFT JOIN pg_namespace n ON x.extnamespace = n.oid
  LEFT JOIN pg_available_extension_versions ev
    ON ev.name = e.name AND ev.version = e.default_version;
`.trim()

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
