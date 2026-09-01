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
 * The database cells whose SQL mutates data or schema, for flagging before a notebook-wide run.
 */
export function findMutatingQueryCells({
  cells,
  getLiveSql,
}: {
  cells: readonly Snapshot<Cell>[]
  /**
   * Lets a caller also check each cell's live editor buffer as well. The store
   * only updates on a Monaco blur commit, which fires asynchronously, so a scan
   * against the store alone can miss SQL typed just before the run click.
   * */
  getLiveSql?: (cellId: string) => string | undefined
}): { id: string; title: string }[] {
  return cells
    .filter((cell): cell is Snapshot<DatabaseCell> => cell._tag === 'database_cell')
    .filter((cell) => {
      const liveSql = getLiveSql?.(cell._id)
      return isMutatingSql(cell.unchecked_sql) || (liveSql !== undefined && isMutatingSql(liveSql))
    })
    .map((cell) => ({ id: cell._id, title: cell.title ?? 'Untitled query' }))
}
