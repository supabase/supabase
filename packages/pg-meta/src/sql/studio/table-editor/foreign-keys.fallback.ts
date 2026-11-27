/**
 * TEMPORARY. Delete once Spark (turso) runs `getForeignKeyConstraintsSql`, which fails there on
 * `unnest` of a key array.
 */
import { toAttnums, toInt, type CatalogQuery } from '../../../catalog-fallback'
import { joinSqlFragments, literal, safeSql } from '../../../pg-format'
import { arrayText } from '../../../query/write-values.fallback'

/** Fallback for `getForeignKeyConstraintsSql`. */
export async function getForeignKeyConstraintsFallback(
  query: CatalogQuery,
  { schema }: { schema: string }
) {
  const rows = await query(safeSql`
    select con.oid::int8 as id, con.conname as constraint_name, con.confdeltype as deletion_action,
      con.confupdtype as update_action, rel.oid::int8 as source_id, nsp.nspname as source_schema,
      rel.relname as source_table, con.conkey::text as source_keys, frel.oid::int8 as target_id,
      fnsp.nspname as target_schema, frel.relname as target_table, con.confkey::text as target_keys
    from pg_catalog.pg_constraint con
    join pg_catalog.pg_class rel on rel.oid = con.conrelid
    join pg_catalog.pg_namespace nsp on nsp.oid = rel.relnamespace
    join pg_catalog.pg_class frel on frel.oid = con.confrelid
    join pg_catalog.pg_namespace fnsp on fnsp.oid = frel.relnamespace
    where con.contype = 'f' and nsp.nspname = ${literal(schema)}`)
  const tableIds = [...new Set(rows.flatMap((row) => [toInt(row.source_id), toInt(row.target_id)]))]
  const attributes =
    tableIds.length === 0
      ? []
      : await query(safeSql`
          select a.attrelid::int8 as table_id, a.attnum as attnum, a.attname as name
          from pg_catalog.pg_attribute a
          where a.attrelid in (${joinSqlFragments(tableIds.map(literal), ', ')})`)
  const attname = new Map(
    attributes.map((row) => [`${toInt(row.table_id)}.${toInt(row.attnum)}`, String(row.name)])
  )
  // pg returns the `name[]` from array_agg in its text form, which Studio parses.
  const names = (tableId: number, keys: unknown) => {
    const found = toAttnums(keys).flatMap((n) => attname.get(`${tableId}.${n}`) ?? [])
    return found.length > 0 ? arrayText(found) : null
  }
  return rows.map((row) => ({
    id: toInt(row.id),
    constraint_name: String(row.constraint_name),
    deletion_action: String(row.deletion_action),
    update_action: String(row.update_action),
    source_id: toInt(row.source_id),
    source_schema: String(row.source_schema),
    source_table: String(row.source_table),
    source_columns: names(toInt(row.source_id), row.source_keys),
    target_id: toInt(row.target_id),
    target_schema: String(row.target_schema),
    target_table: String(row.target_table),
    target_columns: names(toInt(row.target_id), row.target_keys),
  }))
}
