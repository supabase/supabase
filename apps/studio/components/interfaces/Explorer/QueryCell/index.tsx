import { AlignLeft } from 'lucide-react'
import { forwardRef, useState } from 'react'
import { KeyboardShortcut } from 'ui'
import { type Snapshot } from 'valtio'

import { AddCellDropdown } from '../AddCellDropdown'
import { ExplorerToolbarAction } from '../ExplorerToolbar'
import { MoveCellDropdownContent } from '../MoveCellDropdownContent'
import { QueryEditor, type QueryEditorHandle } from '../QueryEditor'
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
import { useLocalRoleImpersonationState } from '@/state/role-impersonation-state'
import { hotkeyToKeys } from '@/state/shortcuts/formatShortcut'
import { SHORTCUT_DEFINITIONS, SHORTCUT_IDS } from '@/state/shortcuts/registry'

const PRETTIFY_SHORTCUT_KEYS = hotkeyToKeys(
  SHORTCUT_DEFINITIONS[SHORTCUT_IDS.SQL_EDITOR_FORMAT].sequence[0]
)

interface QueryCellProps {
  cell: Snapshot<QueryCellSchema>
  onEdit?: () => void
  onPrettifyQuery?: () => void
}

/** Notebook adapter around the shared QueryEditor. */
export const QueryCell = forwardRef<QueryEditorHandle, QueryCellProps>(function QueryCell(
  { cell, onEdit, onPrettifyQuery },
  ref
) {
  const snap = useNotebooksStateSnapshot()
  const currentNotebook = useCurrentNotebook()

  const [sql, setSql] = useState<string>(cell.unchecked_sql)
  const [result, setResult] = useState<QueryResult>()
  const roleImpersonationState = useLocalRoleImpersonationState()

  const title = cell.title ?? 'Untitled query'
  const showQuery =
    snap.cellLocalState.get(cell._id)?.showQuery ?? currentNotebook?.status === 'new'

  /**
   * Applies an update to this cell. The updater runs against the cell as the store holds
   * it rather than the snapshot this component rendered with, so a concurrent edit isn't
   * clobbered; `isQueryCell` keeps the per-backend helpers off a markdown cell that
   * somehow shares the id.
   */
  const updateQueryCell = (updater: (candidate: Snapshot<QueryCellSchema>) => QueryCellSchema) => {
    const notebookId = currentNotebook?.notebook.id
    if (!notebookId) return

    onEdit?.()
    snap.updateCell({
      id: notebookId,
      cellId: cell._id,
      updater: (candidate) => {
        if (!isQueryCell(candidate)) return candidate
        return updater(candidate)
      },
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

  // Running a cell re-commits its current SQL (see QueryEditor's handleRunQuery) even when
  // nothing changed — skip the store write so that doesn't spuriously mark the notebook
  // unsaved.
  const handleSqlCommit = (value: string) => {
    if (value === cell.unchecked_sql) return
    updateQueryCell((candidate) => setCellSql(candidate, value))
  }

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
      id={cell._id}
      actions={<AddCellDropdown cellId={cell._id} />}
      gripDropdownContent={<MoveCellDropdownContent cellId={cell._id} />}
      gripClassName="mt-2 opacity-0 group-hover:opacity-100 has-[[data-state=open]]:opacity-100 transition"
    >
      <QueryEditor
        ref={ref}
        id={cell._id}
        variant="embedded"
        title={title}
        query={toQueryModel(cell, sql)}
        result={result}
        showQuery={showQuery}
        onShowQueryChange={(showQuery) => snap.setQueryVisibility({ cellId: cell._id, showQuery })}
        roleImpersonationState={roleImpersonationState}
        display={getCellDisplay(cell)}
        onTitleChange={handleTitleChange}
        onSqlChange={setSql}
        onSqlCommit={handleSqlCommit}
        onSourceChange={handleSourceChange}
        onResultChange={setResult}
        onRowLimitChange={handleRowLimitChange}
        onDisplayChange={handleDisplayChange}
        toolbarActions={
          <ExplorerToolbarAction
            icon={<AlignLeft />}
            tooltip={
              <div className="flex items-center gap-2.5">
                <span>Prettify SQL</span>
                <KeyboardShortcut keys={PRETTIFY_SHORTCUT_KEYS} />
              </div>
            }
            onClick={onPrettifyQuery}
          />
        }
      />
    </SortableSection>
  )
})
