/**
 * TEMPORARY. Delete once Spark (turso) has `pg_available_extensions` and runs `extensions.list` and
 * `getDatabaseExtensionsSQL`.
 *
 * Lists installed extensions from `pg_extension` alone: extensions that are available but not
 * installed are missing, and the default version reads as the installed one.
 */
import { toText, type CatalogQuery } from '../catalog-fallback'
import { safeSql } from '../pg-format'

async function installedExtensions(query: CatalogQuery) {
  const rows = await query(safeSql`
    select x.extname as name, n.nspname as schema, x.extversion as version
    from pg_catalog.pg_extension x
    left join pg_catalog.pg_namespace n on n.oid = x.extnamespace`)
  return rows.map((row) => ({
    name: String(row.name),
    schema: toText(row.schema),
    default_version: String(row.version),
    installed_version: toText(row.version),
    comment: null,
  }))
}

/** Fallback for `extensions.list`. */
export const listExtensionsFallback = (query: CatalogQuery) => installedExtensions(query)

/** Fallback for `getDatabaseExtensionsSQL`. */
export async function getDatabaseExtensionsFallback(query: CatalogQuery) {
  return (await installedExtensions(query)).map((extension) => ({
    ...extension,
    default_version_schema: null,
  }))
}
