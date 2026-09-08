import { type Snapshot } from 'valtio'

import { type Cell } from '@/data/content/notebooks/notebook-schema'
import { removeCommentsFromSql } from '@/lib/helpers'

const MUTATING_STATEMENT_REGEX =
  /^\s*(insert|update|delete|create|alter|drop|truncate|grant|revoke|merge)\b/i

export type QueryCellSummary = { id: string; title: string }

type FindQueryCellsArgs = {
  cells: readonly Snapshot<Cell>[]
  /**
   * Lets a caller also check each cell's live editor buffer as well. The store
   * only updates on a Monaco blur commit, which fires asynchronously, so a scan
   * against the store alone can miss SQL typed just before the run click.
   */
  getLiveSql?: (cellId: string) => string | undefined
}

type SqlMatchers = Record<string, (sql: string) => boolean>

/**
 * Finds database cells that match one or more SQL predicates in a single pass.
 */
export function findQueryCellsMatchingSql<T extends SqlMatchers>({
  cells,
  getLiveSql,
  matchers,
}: FindQueryCellsArgs & {
  matchers: T
}): Record<keyof T, QueryCellSummary[]> {
  const matchingCells = {} as Record<keyof T, QueryCellSummary[]>
  for (const name in matchers) {
    matchingCells[name] = []
  }

  cells.forEach((cell) => {
    if (cell._tag !== 'database_cell') return

    const sql = [cell.unchecked_sql, getLiveSql?.(cell._id)].filter(
      (value): value is string => value !== undefined
    )
    const summary = { id: cell._id, title: cell.title ?? 'Untitled query' }

    for (const name in matchers) {
      if (sql.some(matchers[name])) matchingCells[name].push(summary)
    }
  })

  return matchingCells
}

/**
 * Whether `sql` contains any statement that writes to data or schema, as opposed to a
 * read-only query. Checked per `;`-delimited statement so a mutating statement anywhere
 * in a multi-statement cell is caught, not just when it leads.
 */
export function isMutatingSql(sql: string): boolean {
  const cleanedSql = removeCommentsFromSql(sql)
  return cleanedSql.split(';').some((statement) => MUTATING_STATEMENT_REGEX.test(statement))
}
