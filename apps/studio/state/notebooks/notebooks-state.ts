import { type UniqueIdentifier } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useParams } from 'common'
import { useMemo } from 'react'
import { proxy, snapshot, useSnapshot, type Snapshot } from 'valtio'
import { proxyMap } from 'valtio/utils'

import type { Notebook, StateNotebook } from './types'
import type { SnippetStatus } from '@/data/content/snippet-status'
import type { Notebooks } from '@/types'

// [Joshen] Deliberately copied from sql-editor-lifecycle cause we might deprecate
// that in favor of notebooks in the long run
function statusOnEdit(status: SnippetStatus): SnippetStatus {
  return status === 'saved' ? 'unsaved' : status
}

export const notebooksState = proxy({
  notebooks: {} as Record<string, StateNotebook>,
  needsSaving: proxyMap<string, boolean>([]),

  /**
   * Load notebook into the Valtio store. No-ops if already present.
   */
  addNotebook: ({ projectRef, notebook }: { projectRef: string; notebook: Notebook }) => {
    if (notebooksState.notebooks[notebook.id]) return
    notebooksState.notebooks[notebook.id] = { projectRef, notebook, status: 'new' }
  },

  /**
   * Load notebook content into the store. Notebooks fetched from the list
   * endpoint don't have `content` loaded (to keep that response small), so
   * content is fetched separately and merged in here on demand.
   *
   * Unlike `addNotebook` (for locally-created notebooks, status 'new'), a
   * notebook reaching this function was already persisted, so it's inserted
   * with status 'saved'.
   */
  setNotebook: ({ projectRef, notebook }: { projectRef: string; notebook: Notebook }) => {
    const stateNotebook = notebooksState.notebooks[notebook.id]
    if (stateNotebook) {
      if (!stateNotebook.notebook.content) {
        stateNotebook.notebook.content = notebook.content
      }
    } else {
      notebooksState.notebooks[notebook.id] = { projectRef, notebook, status: 'saved' }
    }
  },

  /**
   * Rename follows its own async save directly at the call site rather than going
   * through needsSaving/the debounced scheduler.
   */
  renameNotebook: ({ id, name }: { id: string; name: string }) => {
    const stateNotebook = notebooksState.notebooks[id]
    if (stateNotebook) {
      stateNotebook.notebook.name = name
    }
  },

  /**
   * Remove notebook from the store, and optionally remove it from the sync
   * saving queue. Also clears any cached query-cell results for this notebook
   * from the ephemeral session store.
   */
  removeNotebook: ({ id, skipSave = false }: { id: string; skipSave?: boolean }) => {
    const { [id]: notebook, ...otherNotebooks } = notebooksState.notebooks
    notebooksState.notebooks = otherNotebooks
    if (!skipSave) notebooksState.needsSaving.delete(id)

    // TODO: clear notebookSessionState once it exists
  },

  /**
   * Replace a notebook's full cell array and queue it for sync saving. The
   * single entry point for every cell-level change — adding, removing,
   * reordering, or editing a cell's content all compute the next `cells` array
   * at the call site and pass it here, since the notebook is saved as one JSON
   * document rather than per-cell.
   */
  updateCells: ({
    id,
    cells,
    skipSave,
  }: {
    id: string
    cells: Snapshot<Notebooks.Cell>[]
    skipSave?: boolean
  }) => {
    const stateNotebook = notebooksState.notebooks[id]
    if (!stateNotebook?.notebook.content) return
    stateNotebook.notebook.content.cells = cells as Notebooks.Cell[]
    stateNotebook.status = statusOnEdit(stateNotebook.status)
    if (!skipSave) notebooksState.needsSaving.set(id, false)
  },

  /**
   * Insert a cell right after `cellId` in a notebook's cell array — or at the
   * end, if `cellId` is omitted or isn't found (e.g. an empty notebook has no
   * cell to insert after). The caller builds the cell to insert (e.g. via
   * `createMarkdownCellSkeleton`/`createQueryCellSkeleton`) since deciding
   * what kind of cell to create is a UI concern, not a state one.
   */
  insertCellAfter: ({
    id,
    cellId,
    cell,
  }: {
    id: string
    cellId?: string
    cell: Notebooks.Cell
  }) => {
    const stateNotebook = notebooksState.notebooks[id]
    if (!stateNotebook?.notebook.content) return

    const cells = stateNotebook.notebook.content.cells
    const insertAt = cellId ? cells.findIndex((c) => c._id === cellId) : -1
    const nextCells = [...cells]
    nextCells.splice(insertAt === -1 ? cells.length : insertAt + 1, 0, cell)

    notebooksState.updateCells({ id, cells: nextCells })
  },

  /**
   * Update a single cell in a notebook's cell array via an updater callback.
   * The caller decides how the cell's content should change (e.g. field
   * defaults, tag conversion) since that's a UI concern, not a state one —
   * this only finds the cell by id and re-saves the array.
   */
  updateCell: ({
    id,
    cellId,
    updater,
  }: {
    id: string
    cellId: string
    updater: (cell: Notebooks.Cell) => Notebooks.Cell
  }) => {
    const stateNotebook = notebooksState.notebooks[id]
    if (!stateNotebook?.notebook.content) return

    const nextCells = stateNotebook.notebook.content.cells.map((cell) =>
      cell._id === cellId ? updater(cell) : cell
    )
    notebooksState.updateCells({ id, cells: nextCells })
  },

  /**
   * Remove a single cell from a notebook's cell array.
   */
  removeCell: ({ id, cellId }: { id: string; cellId: string }) => {
    const stateNotebook = notebooksState.notebooks[id]
    if (!stateNotebook?.notebook.content) return

    const nextCells = stateNotebook.notebook.content.cells.filter((c) => c._id !== cellId)
    notebooksState.updateCells({ id, cells: nextCells })
  },

  /**
   * Shift a cell one position up or down in a notebook's cell array. No-ops if
   * the cell is already at that boundary (or isn't found).
   */
  moveCell: ({
    id,
    cellId,
    direction,
  }: {
    id: string
    cellId: string
    direction: 'up' | 'down'
  }) => {
    const stateNotebook = notebooksState.notebooks[id]
    if (!stateNotebook?.notebook.content) return

    const cells = stateNotebook.notebook.content.cells
    const currentIndex = cells.findIndex((c) => c._id === cellId)
    if (currentIndex === -1) return

    const nextIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (nextIndex < 0 || nextIndex >= cells.length) return

    notebooksState.updateCells({ id, cells: arrayMove([...cells], currentIndex, nextIndex) })
  },

  /**
   * Reorder a notebook's cell array by moving the cell at `activeCellId` to
   * where `overCellId` currently sits (dnd-kit's drag-end positions).
   */
  reorderCells: ({
    id,
    activeCellId,
    overCellId,
  }: {
    id: string
    activeCellId: UniqueIdentifier
    overCellId: UniqueIdentifier
  }) => {
    const stateNotebook = notebooksState.notebooks[id]
    if (!stateNotebook?.notebook.content) return

    const cells = stateNotebook.notebook.content.cells
    const oldIndex = cells.findIndex((c) => c._id === activeCellId)
    const newIndex = cells.findIndex((c) => c._id === overCellId)
    if (oldIndex === -1 || newIndex === -1) return

    notebooksState.updateCells({ id, cells: arrayMove([...cells], oldIndex, newIndex) })
  },

  addNeedsSaving: (id: string) => notebooksState.needsSaving.set(id, true),
})

export const getNotebooksStateSnapshot = () => snapshot(notebooksState)

export const useNotebooksStateSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(notebooksState, options)

export const useNotebooks = (projectRef: string) => {
  const snapshot = useNotebooksStateSnapshot()
  return useMemo(
    () =>
      Object.values(snapshot.notebooks)
        .filter((x) => x.projectRef === projectRef)
        .map((x) => x.notebook),
    [projectRef, snapshot.notebooks]
  )
}

export const useCurrentNotebook = () => {
  const { id, ref } = useParams()
  const snapshot = useNotebooksStateSnapshot()
  const currentNotebook = id ? snapshot.notebooks[id] : undefined

  if (!currentNotebook || currentNotebook.projectRef !== ref) return undefined

  return currentNotebook
}
