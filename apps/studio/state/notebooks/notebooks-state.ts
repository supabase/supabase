import { useMemo } from 'react'
import { proxy, snapshot, useSnapshot } from 'valtio'
import { proxyMap } from 'valtio/utils'

import type { Notebook, StateNotebook } from './types'
import type { Cell } from '@/data/content/notebooks/notebook-schema'
import type { SnippetStatus } from '@/data/content/snippet-status'

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
  updateCells: ({ id, cells, skipSave }: { id: string; cells: Cell[]; skipSave?: boolean }) => {
    const stateNotebook = notebooksState.notebooks[id]
    if (!stateNotebook?.notebook.content) return
    stateNotebook.notebook.content.cells = cells
    stateNotebook.status = statusOnEdit(stateNotebook.status)
    if (!skipSave) notebooksState.needsSaving.set(id, false)
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
