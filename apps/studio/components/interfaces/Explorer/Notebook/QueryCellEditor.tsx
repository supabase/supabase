import { forwardRef, useState, type ReactNode } from 'react'
import { type Snapshot } from 'valtio'

import {
  changeCellSource,
  cloneChartConfig,
  cloneQueryCell,
  getCellDisplay,
  setCellRowLimit,
  setCellSql,
  shouldInvalidateResultOnSourceChange,
  toQueryModel,
} from '../QueryCell/QueryCell.utils'
import { QueryEditor, type QueryEditorHandle } from '../QueryEditor'
import { type QueryDisplay, type QueryResult } from '../types'
import { type QueryCell } from '@/data/content/notebooks/notebook-schema'
import { type QuerySourceBinding } from '@/data/query-sources/query-source-registry'
import { useLocalRoleImpersonationState } from '@/state/role-impersonation-state'

export type QueryCellUpdater = (cell: Snapshot<QueryCell>) => QueryCell

interface QueryCellEditorProps {
  cell: Snapshot<QueryCell>
  /** Receives every change to the cell as an updater, so the caller decides where it goes. */
  onCellChange: (updater: QueryCellUpdater) => void
  showQuery: boolean
  onShowQueryChange: (showQuery: boolean) => void
  toolbarActions?: ReactNode
}

/**
 * A notebook query cell wired to the shared QueryEditor. Owns the editor buffer and the
 * cell's last result; persisting the cell is left to `onCellChange`.
 */
export const QueryCellEditor = forwardRef<QueryEditorHandle, QueryCellEditorProps>(
  function QueryCellEditor(
    { cell, onCellChange, showQuery, onShowQueryChange, toolbarActions },
    ref
  ) {
    const roleImpersonationState = useLocalRoleImpersonationState()
    const [sql, setSql] = useState<string>(cell.unchecked_sql)
    const [result, setResult] = useState<QueryResult>()

    const handleSourceChange = (source: QuerySourceBinding) => {
      // The query text carries over (see `changeCellSource`), so the editor's buffer stays
      // valid — but a result run against the old source (backend or time range) does not.
      if (shouldInvalidateResultOnSourceChange(cell, source)) setResult(undefined)
      onCellChange((candidate) => changeCellSource(candidate, source))
    }

    const handleTitleChange = (value: string) => {
      const nextTitle = value.trim()
      if (!nextTitle) return
      onCellChange((candidate) => ({ ...cloneQueryCell(candidate), title: nextTitle }))
    }

    // Running a cell re-commits its current SQL (see QueryEditor's handleRunQuery) even when
    // nothing changed — skip the update so that doesn't spuriously mark the cell edited.
    const handleSqlCommit = (value: string) => {
      if (value === cell.unchecked_sql) return
      onCellChange((candidate) => setCellSql(candidate, value))
    }

    const handleDisplayChange = (display: QueryDisplay) =>
      onCellChange((candidate) => ({
        ...cloneQueryCell(candidate),
        view: display.view,
        chart: cloneChartConfig(display.chart),
      }))

    const handleRowLimitChange = (rowLimit: number) =>
      onCellChange((candidate) => setCellRowLimit(candidate, rowLimit))

    return (
      <QueryEditor
        ref={ref}
        id={cell._id}
        variant="embedded"
        className="min-h-0"
        title={cell.title ?? 'Untitled query'}
        query={toQueryModel(cell, sql)}
        result={result}
        showQuery={showQuery}
        onShowQueryChange={onShowQueryChange}
        roleImpersonationState={roleImpersonationState}
        display={getCellDisplay(cell)}
        onTitleChange={handleTitleChange}
        onSqlChange={setSql}
        onSqlCommit={handleSqlCommit}
        onSourceChange={handleSourceChange}
        onResultChange={setResult}
        onRowLimitChange={handleRowLimitChange}
        onDisplayChange={handleDisplayChange}
        toolbarActions={toolbarActions}
      />
    )
  }
)
