/**
 * TEMPORARY. Delete once Spark (turso) runs `getUsersCountSQL`, which fails there on the `pg_temp`
 * count-estimate function.
 *
 * Counts exactly with the same filters: a partial catalog has no planner estimate to read.
 */
import type { CatalogQuery } from '../../../catalog-fallback'
import { getUsersCountSQL } from './get-users-count'

/** Fallback for `getUsersCountSQL`: the same row, `[{ count, is_estimate }]`. */
export async function getUsersCountFallback(
  query: CatalogQuery,
  args: Parameters<typeof getUsersCountSQL>[0]
) {
  const [row] = await query(getUsersCountSQL({ ...args, forceExactCount: true }))
  // turso names the scalar subquery `?column?` where Postgres names it `count`.
  const count = row?.count ?? Object.values(row ?? {})[0]
  return [{ count: Number(count ?? 0), is_estimate: false }]
}
