import { type Snapshot } from 'valtio'

import { type Cell, type DatabaseCell } from '@/data/content/notebooks/notebook-schema'
import { removeCommentsFromSql } from '@/lib/helpers'

const MUTATING_STATEMENT_REGEX =
  /^\s*(insert|update|delete|create|alter|drop|truncate|grant|revoke|merge)\b/i

/**
 * Whether `sql` contains any statement that writes to data or schema, as opposed to a
 * read-only query. Checked per `;`-delimited statement so a mutating statement anywhere
 * in a multi-statement cell is caught, not just when it leads.
 */
export function isMutatingSql(sql: string): boolean {
  const cleanedSql = removeCommentsFromSql(sql)
  return cleanedSql.split(';').some((statement) => MUTATING_STATEMENT_REGEX.test(statement))
}

/**
 * The database cells (log cells are read-only analytics queries and excluded) among
 * `cells` whose SQL mutates data or schema, for flagging before a notebook-wide run.
 */
export function findMutatingQueryCells(
  cells: readonly Snapshot<Cell>[]
): { id: string; title: string }[] {
  return cells
    .filter((cell): cell is Snapshot<DatabaseCell> => cell._tag === 'database_cell')
    .filter((cell) => isMutatingSql(cell.unchecked_sql))
    .map((cell) => ({ id: cell._id, title: cell.title ?? 'Untitled query' }))
}
