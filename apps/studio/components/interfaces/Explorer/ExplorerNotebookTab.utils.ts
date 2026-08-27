import { type Snapshot } from 'valtio'

import { checkDestructiveQuery } from '@/components/interfaces/SQLEditor/SQLEditor.utils'
import { type Cell, type DatabaseCell } from '@/data/content/notebooks/notebook-schema'
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

const findDatabaseCellsMatchingSql = (
  { cells, getLiveSql }: FindQueryCellsArgs,
  matches: (sql: string) => boolean
): QueryCellSummary[] =>
  cells
    .filter((cell): cell is Snapshot<DatabaseCell> => cell._tag === 'database_cell')
    .filter((cell) => {
      const liveSql = getLiveSql?.(cell._id)
      return matches(cell.unchecked_sql) || (liveSql !== undefined && matches(liveSql))
    })
    .map((cell) => ({ id: cell._id, title: cell.title ?? 'Untitled query' }))

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
}: FindQueryCellsArgs): QueryCellSummary[] {
  return findDatabaseCellsMatchingSql({ cells, getLiveSql }, isMutatingSql)
}

/**
 * The database cells whose SQL includes an operation that the shared SQL editor considers
 * destructive. Checked after the notebook-wide mutation consent, before a forced batch run.
 */
export function findDestructiveQueryCells({
  cells,
  getLiveSql,
}: FindQueryCellsArgs): QueryCellSummary[] {
  return findDatabaseCellsMatchingSql({ cells, getLiveSql }, checkDestructiveQuery)
}
