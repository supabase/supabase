import { useState } from 'react'
import { type Snapshot } from 'valtio'

import { AddCellDropdown } from '../AddCellDropdown'
import { MoveCellDropdownContent } from '../MoveCellDropdownContent'
import { QueryEditor } from '../QueryEditor'
import { type QueryDisplay, type QueryResult } from '../types'
import {
  changeCellSource,
  cloneChartConfig,
  cloneQueryCell,
  getCellDisplay,
  setCellRowLimit,
  setCellSql,
  toQueryModel,
} from './QueryCell.utils'
import { SortableSection } from '@/components/ui/SortableSection'
import {
  isQueryCell,
  type QueryCell as QueryCellSchema,
} from '@/data/content/notebooks/notebook-schema'
import { type QuerySourceBinding } from '@/data/query-sources/query-source-registry'
import { useCurrentNotebook, useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'

interface QueryCellProps {
  cell: Snapshot<QueryCellSchema>
}

/** Notebook adapter around the shared QueryEditor. */
export const QueryCell = ({ cell }: QueryCellProps) => {
  const snap = useNotebooksStateSnapshot()
  const currentNotebook = useCurrentNotebook()

  const [sql, setSql] = useState<string>(cell.unchecked_sql)
  const [result, setResult] = useState<QueryResult>()

  const title = cell.title ?? 'Untitled query'

  /**
   * Applies an update to this cell. The updater runs against the cell as the store holds
   * it rather than the snapshot this component rendered with, so a concurrent edit isn't
   * clobbered; `isQueryCell` keeps the per-backend helpers off a markdown cell that
   * somehow shares the id.
   */
  const updateQueryCell = (updater: (candidate: Snapshot<QueryCellSchema>) => QueryCellSchema) => {
    const notebookId = currentNotebook?.notebook.id
    if (!notebookId) return

    snap.updateCell({
      id: notebookId,
      cellId: cell.id,
      updater: (candidate) => (isQueryCell(candidate) ? updater(candidate) : candidate),
    })
  }

  const handleSourceChange = (source: QuerySourceBinding) => {
    // The query text carries over (see `changeCellSource`), so the editor's buffer stays
    // valid — but a result the old backend produced does not, since another engine
    // returns unrelated columns.
    const isBackendChange = (source._tag === 'logs') !== (cell._tag === 'log_cell')
    if (isBackendChange) setResult(undefined)

    updateQueryCell((candidate) => changeCellSource(candidate, source))
  }

  const handleTitleChange = (value: string) => {
    const nextTitle = value.trim()
    if (!nextTitle) return
    updateQueryCell((candidate) => ({ ...cloneQueryCell(candidate), title: nextTitle }))
  }

  const handleSqlCommit = (value: string) =>
    updateQueryCell((candidate) => setCellSql(candidate, value))

  const handleDisplayChange = (display: QueryDisplay) =>
    updateQueryCell((candidate) => ({
      ...cloneQueryCell(candidate),
      view: display.view,
      chart: cloneChartConfig(display.chart),
    }))

  const handleRowLimitChange = (rowLimit: number) =>
    updateQueryCell((candidate) => setCellRowLimit(candidate, rowLimit))

  return (
    <SortableSection
      id={cell.id}
      actions={<AddCellDropdown cellId={cell.id} />}
      gripDropdownContent={<MoveCellDropdownContent cellId={cell.id} />}
      gripClassName="mt-2 opacity-0 group-hover:opacity-100 has-[[data-state=open]]:opacity-100 transition"
    >
      <QueryEditor
        id={cell.id}
        variant="embedded"
        title={title}
        query={toQueryModel(cell, sql)}
        result={result}
        display={getCellDisplay(cell)}
        onTitleChange={handleTitleChange}
        onSqlChange={setSql}
        onSqlCommit={handleSqlCommit}
        onSourceChange={handleSourceChange}
        onResultChange={setResult}
        onRowLimitChange={handleRowLimitChange}
        onDisplayChange={handleDisplayChange}
      />
    </SortableSection>
  )
}
