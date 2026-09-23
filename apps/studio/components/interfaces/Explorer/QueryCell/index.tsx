import { AlignLeft } from 'lucide-react'
import { forwardRef } from 'react'
import { KeyboardShortcut } from 'ui'
import { type Snapshot } from 'valtio'

import { AddCellDropdown } from '../AddCellDropdown'
import { ExplorerToolbarAction } from '../ExplorerToolbar'
import { MoveCellDropdownContent } from '../MoveCellDropdownContent'
import { NOTEBOOK_CELL_WIDTH } from '../Notebook/notebook.utils'
import { QueryCellEditor, type QueryCellUpdater } from '../Notebook/QueryCellEditor'
import { type QueryEditorHandle } from '../QueryEditor'
import { SortableSection } from '@/components/ui/SortableSection'
import {
  isQueryCell,
  type QueryCell as QueryCellSchema,
} from '@/data/content/notebooks/notebook-schema'
import { useCurrentNotebook, useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'
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

/** Explorer's notebook query cell: a QueryCellEditor backed by the notebook store. */
export const QueryCell = forwardRef<QueryEditorHandle, QueryCellProps>(function QueryCell(
  { cell, onEdit, onPrettifyQuery },
  ref
) {
  const snap = useNotebooksStateSnapshot()
  const currentNotebook = useCurrentNotebook()

  const showQuery =
    snap.cellLocalState.get(cell._id)?.showQuery ?? currentNotebook?.status === 'new'

  /**
   * Applies an update to this cell. The updater runs against the cell as the store holds
   * it rather than the snapshot this component rendered with, so a concurrent edit isn't
   * clobbered; `isQueryCell` keeps the per-backend helpers off a markdown cell that
   * somehow shares the id.
   */
  const updateQueryCell = (updater: QueryCellUpdater) => {
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

  return (
    <SortableSection
      id={cell._id}
      sectionWidth={NOTEBOOK_CELL_WIDTH}
      actions={<AddCellDropdown cellId={cell._id} />}
      gripDropdownContent={<MoveCellDropdownContent cellId={cell._id} />}
      gripClassName="mt-2 sm:opacity-0 group-hover:opacity-100 has-[[data-state=open]]:opacity-100 transition"
    >
      <QueryCellEditor
        ref={ref}
        cell={cell}
        onCellChange={updateQueryCell}
        showQuery={showQuery}
        onShowQueryChange={(showQuery) => snap.setQueryVisibility({ cellId: cell._id, showQuery })}
        toolbarActions={
          <ExplorerToolbarAction
            icon={<AlignLeft size={16} strokeWidth={2} />}
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
