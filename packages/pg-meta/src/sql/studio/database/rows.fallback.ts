/**
 * TEMPORARY. Delete once Spark (turso) runs `getTableRowsCountSql`, which fails there on the
 * `pg_temp` count-estimate function and `pg_partition_tree`.
 *
 * Counts exactly: a partial catalog has no planner estimate to read.
 */
import { toInt, type CatalogQuery } from '../../../catalog-fallback'
import { Filter, Query } from '../../../query'

/** Fallback for `getTableRowsCountSql`: the same row, `[{ count, is_estimate }]`. */
export async function getTableRowsCountFallback(
  query: CatalogQuery,
  { table, filters = [] }: { table: { name: string; schema?: string | null }; filters?: Filter[] }
) {
  let chain = new Query().from(table.name, table.schema ?? undefined).count()
  filters
    .filter((filter) => filter.value && filter.value !== '')
    .forEach((filter) => {
      chain = chain.filter(filter.column, filter.operator, filter.value)
    })
  const [row] = await query(chain.toSql())
  return [{ count: toInt(row?.count), is_estimate: false }]
}
