/**
 * TEMPORARY. Delete once Spark (turso) runs `getIndexesSQL`, which fails there on `unnest` of an
 * `int2vector`.
 */
import { toAttnums, toInt, type CatalogQuery } from '../../../catalog-fallback'
import { joinSqlFragments, literal, safeSql } from '../../../pg-format'

const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

/** Fallback for `getIndexesSQL`. */
export async function getIndexesFallback(query: CatalogQuery, { schema }: { schema: string }) {
  const indexes = await query(safeSql`
    select n.nspname as schema, t.relname as table, i.relname as name,
      pg_get_indexdef(idx.indexrelid) as definition, idx.indrelid::int8 as table_id,
      idx.indkey::text as keys
    from pg_catalog.pg_index idx
    join pg_catalog.pg_class t on t.oid = idx.indrelid
    join pg_catalog.pg_class i on i.oid = idx.indexrelid
    join pg_catalog.pg_namespace n on n.oid = t.relnamespace
    where n.nspname = ${literal(schema)}`)
  const tableIds = [...new Set(indexes.map((row) => toInt(row.table_id)))]
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
  return indexes
    .map((row) => ({
      schema: String(row.schema),
      table: String(row.table),
      name: String(row.name),
      definition: String(row.definition),
      columns: toAttnums(row.keys)
        .map((attnum) => attname.get(`${toInt(row.table_id)}.${attnum}`) ?? '(expression)')
        .join(', '),
    }))
    .sort(
      (a, b) =>
        compareText(a.schema, b.schema) ||
        compareText(a.table, b.table) ||
        compareText(a.name, b.name)
    )
}
