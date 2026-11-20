/**
 * TEMPORARY. Delete once Spark (turso) runs `getTableConstraintsSql`, which fails there on
 * `to_regclass`.
 */
import { toInt, type CatalogQuery } from '../../../catalog-fallback'
import { literal, safeSql } from '../../../pg-format'

/** Fallback for `getTableConstraintsSql`. */
export async function getTableConstraintsFallback(query: CatalogQuery, { id }: { id: number }) {
  const rows = await query(safeSql`
    select con.oid::int8 as id, con.conname as name, con.contype as type
    from pg_catalog.pg_constraint con
    where con.conrelid = ${literal(id)}`)
  return rows.map((row) => ({ id: toInt(row.id), name: String(row.name), type: String(row.type) }))
}
