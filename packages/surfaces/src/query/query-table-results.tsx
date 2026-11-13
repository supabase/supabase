import { QUERY_RESULT_ROW_LIMIT, type QuerySource, type Row, type Table } from '../contract'
import type { QueryResult } from './query-model'
import { QueryResultsGrid } from './query-results-grid'

interface QueryTableResultsProps {
  result?: QueryResult
  /** Table metadata for current, non-stale results. */
  table?: Table
  columns: string[]
  isBusy: boolean
  canEdit: boolean
  canInsert: boolean
  source: QuerySource
  onEditRow: (row: Row) => void
  className?: string
}

export function QueryTableResults({
  result,
  table,
  columns,
  isBusy,
  canEdit,
  canInsert,
  source,
  onEditRow,
  className,
}: QueryTableResultsProps) {
  const hasColumns = !!result && columns.length > 0
  return (
    <div aria-busy={isBusy} className={className}>
      {!result && isBusy && (
        <p className="p-3 text-xs text-foreground-lighter">
          Running query on your {source === 'logs' ? 'logs' : 'database'}…
        </p>
      )}
      {!result && !isBusy && (
        <p className="p-3 text-xs text-foreground-lighter">
          Write SQL above and run it to see results.
        </p>
      )}
      {result && !hasColumns && (
        <p className="p-3 text-xs text-foreground-lighter">Success. No rows returned</p>
      )}
      {result && hasColumns && (
        <QueryResultsGrid
          rows={result.rows}
          columns={columns}
          table={table}
          offset={result.offset}
          canEdit={canEdit}
          isBusy={isBusy}
          onEditRow={onEditRow}
        />
      )}
      {result && hasColumns && result.rows.length === 0 && (
        <p className="p-3 text-xs text-foreground-lighter">
          {canInsert
            ? 'Success. No rows returned. Insert a row to add data to this table.'
            : 'Success. No rows returned'}
        </p>
      )}
      {result?.truncated && (
        <p className="px-3 py-2 text-xs text-foreground-lighter">
          Showing the first {QUERY_RESULT_ROW_LIMIT.toLocaleString()} returned rows. Add a LIMIT to
          your SQL to bound larger queries.
        </p>
      )}
    </div>
  )
}
