import { type UniqueIdentifier } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { useParams } from 'common'
import { useMemo } from 'react'
import { proxy, snapshot, useSnapshot, type Snapshot } from 'valtio'
import { proxyMap } from 'valtio/utils'

import { persistNotebookDraft, readNotebookDraft, removeNotebookDraft } from './notebook-drafts'
import type { Notebook, StateNotebook } from './types'
import { isQueryCell } from '@/data/content/notebooks/notebook-schema'
import type { SnippetStatus } from '@/data/content/snippet-status'
import type { Notebooks } from '@/types'

function statusOnEdit(status: SnippetStatus): SnippetStatus {
  return status === 'saved' ? 'unsaved' : status
}

type NotebookCellLocalState = {
  showQuery?: boolean
}

export const notebooksState = proxy({
  notebooks: {} as Record<string, StateNotebook>,
  needsSaving: proxyMap<string, boolean>([]),
  /** Session-only UI state keyed by cell ID; never persisted with notebook content. */
  cellLocalState: proxyMap<string, NotebookCellLocalState>([]),
  /** Session-only conflicts where an assistant changed the server while local edits remain. */
  serverDivergedWhileDirty: proxyMap<string, 'updated' | 'deleted'>([]),
  /**
   * Id of the notebook the tab should scroll to the bottom of once rendered —
   * set by a surface that adds a cell to a notebook it's about to navigate to
   * (e.g. "Add to existing notebook" from a query tab), so the newly added
   * cell lands in view.
   */
  pendingScrollToBottom: undefined as string | undefined,

  /**
   * Load notebook into the Valtio store. No-ops if already present.
   */
  addNotebook: ({ projectRef, notebook }: { projectRef: string; notebook: Notebook }) => {
    if (notebooksState.notebooks[notebook.id]) return
    notebooksState.notebooks[notebook.id] = { projectRef, notebook, status: 'new' }

    if (notebook.content) {
      persistNotebookDraft({
        projectRef,
        id: notebook.id,
        name: notebook.name,
        content: notebook.content,
        baseUpdatedAt: null,
      })
    }
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
   * Marks a notebook as persisted after its first successful save. Every
   * later save cycle is covered by `updateCells`'s `statusOnEdit` ('saved' ->
   * 'unsaved' -> ...), but the one-time 'new' -> 'saved' transition has no
   * other trigger — the resource query that would otherwise pick it up is
   * disabled while the notebook is still 'new'.
   *
   * `updatedAt` is the server's confirmed timestamp for this save, so the
   * next locally-persisted draft (if any) branches from an accurate base
   * rather than the notebook's stale initial-load timestamp.
   */
  markSaved: ({ id, updatedAt }: { id: string; updatedAt?: string }) => {
    const stateNotebook = notebooksState.notebooks[id]
    if (stateNotebook) {
      stateNotebook.status = 'saved'
      if (updatedAt) stateNotebook.notebook.updated_at = updatedAt
      removeNotebookDraft({ projectRef: stateNotebook.projectRef, id })
    }
    notebooksState.clearServerDivergence({ id })
  },

  markServerDivergence: ({ id, type }: { id: string; type: 'updated' | 'deleted' }) =>
    notebooksState.serverDivergedWhileDirty.set(id, type),

  clearServerDivergence: ({ id }: { id: string }) =>
    notebooksState.serverDivergedWhileDirty.delete(id),

  /**
   * Rename is bundled into the same "Save changes" action as cell edits, rather than its
   * own immediate save — so it needs the same dirty-tracking and draft persistence as
   * `updateCells`, or a rename with no cell changes would look clean and never get saved.
   */
  renameNotebook: ({ id, name }: { id: string; name: string }) => {
    const stateNotebook = notebooksState.notebooks[id]
    if (!stateNotebook) return

    stateNotebook.notebook.name = name
    stateNotebook.status = statusOnEdit(stateNotebook.status)

    if (stateNotebook.notebook.content) {
      persistNotebookDraft({
        projectRef: stateNotebook.projectRef,
        id,
        name,
        content: stateNotebook.notebook.content,
        baseUpdatedAt: stateNotebook.notebook.updated_at ?? null,
      })
    }
  },

  /**
   * Remove notebook from the store, and optionally remove it from the sync
   * saving queue. Also clears its session-only query-cell UI state.
   */
  removeNotebook: ({ id, skipSave = false }: { id: string; skipSave?: boolean }) => {
    const { [id]: notebook, ...otherNotebooks } = notebooksState.notebooks
    notebook?.notebook.content?.cells.forEach((cell) =>
      notebooksState.cellLocalState.delete(cell._id)
    )
    notebooksState.notebooks = otherNotebooks
    if (!skipSave) notebooksState.needsSaving.delete(id)
    notebooksState.clearServerDivergence({ id })
    if (notebook) removeNotebookDraft({ projectRef: notebook.projectRef, id })
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

    persistNotebookDraft({
      projectRef: stateNotebook.projectRef,
      id,
      name: stateNotebook.notebook.name,
      content: stateNotebook.notebook.content,
      baseUpdatedAt: stateNotebook.notebook.updated_at ?? null,
    })
  },

  /**
   * Applies a locally-persisted draft on top of a freshly-loaded notebook — restoring
   * edits that were never saved before the browser refreshed. `baseUpdatedAt` is the
   * server's current `updated_at` for this notebook; if the draft branched from a
   * different value, the server moved on while the draft was pending (e.g. an assistant
   * edit), so the existing "assistant changes detected" conflict is raised rather than
   * silently restoring over it — the user still sees their draft, but saving it requires
   * the same confirmation an in-session conflict would.
   */
  restoreDraft: ({
    projectRef,
    id,
    baseUpdatedAt,
  }: {
    projectRef: string
    id: string
    baseUpdatedAt: string
  }) => {
    const stateNotebook = notebooksState.notebooks[id]
    if (!stateNotebook) return

    const draft = readNotebookDraft({ projectRef, id })
    if (!draft) return

    stateNotebook.notebook.name = draft.name
    stateNotebook.notebook.content = draft.content
    stateNotebook.status = statusOnEdit('saved')

    if (draft.baseUpdatedAt !== null && draft.baseUpdatedAt !== baseUpdatedAt) {
      notebooksState.markServerDivergence({ id, type: 'updated' })
    }
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
    if (isQueryCell(cell)) notebooksState.cellLocalState.set(cell._id, { showQuery: true })

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

  setQueryVisibility: ({ cellId, showQuery }: { cellId: string; showQuery: boolean }) =>
    notebooksState.cellLocalState.set(cellId, {
      ...notebooksState.cellLocalState.get(cellId),
      showQuery,
    }),

  /**
   * Remove a single cell from a notebook's cell array.
   */
  removeCell: ({ id, cellId }: { id: string; cellId: string }) => {
    const stateNotebook = notebooksState.notebooks[id]
    if (!stateNotebook?.notebook.content) return

    const nextCells = stateNotebook.notebook.content.cells.filter((c) => c._id !== cellId)
    notebooksState.cellLocalState.delete(cellId)
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

  requestScrollToBottom: (id: string) => {
    notebooksState.pendingScrollToBottom = id
  },

  clearPendingScrollToBottom: () => {
    notebooksState.pendingScrollToBottom = undefined
  },
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
