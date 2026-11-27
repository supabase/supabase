/**
 * TEMPORARY. Delete once Spark (turso) runs `schemas.list`, which fails there on `pg_has_role`.
 *
 * The same rows without pg-meta's privilege filter.
 */
import { toInt, toText, type CatalogQuery } from '../catalog-fallback'
import { DEFAULT_SYSTEM_SCHEMAS } from '../constants'
import { safeSql } from '../pg-format'

/** Fallback for `schemas.list`. */
export async function listSchemasFallback(
  query: CatalogQuery,
  {
    includeSystemSchemas = false,
    limit,
    offset = 0,
  }: { includeSystemSchemas?: boolean; limit?: number; offset?: number } = {}
) {
  const rows = await query(safeSql`
    select n.oid::int8 as id, n.nspname as name, u.rolname as owner,
      obj_description(n.oid, 'pg_namespace') as comment
    from pg_catalog.pg_namespace n
    join pg_catalog.pg_roles u on u.oid = n.nspowner`)
  const schemas = rows
    .map((row) => ({
      id: toInt(row.id),
      name: String(row.name),
      owner: String(row.owner),
      comment: toText(row.comment),
    }))
    .filter(
      ({ name }) =>
        !name.startsWith('pg_temp_') &&
        !name.startsWith('pg_toast_temp_') &&
        (includeSystemSchemas || !DEFAULT_SYSTEM_SCHEMAS.includes(name))
    )
  return schemas.slice(offset, limit ? offset + limit : undefined)
}
