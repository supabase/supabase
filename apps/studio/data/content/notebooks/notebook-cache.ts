import type { QueryClient } from '@tanstack/react-query'
import type { Snapshot } from 'valtio'

import { contentKeys } from '@/data/content/keys'
import { notebooksState } from '@/state/notebooks/notebooks-state'
import type { StateNotebook } from '@/state/notebooks/types'
import { hasUnsavedChanges } from '@/state/sql-editor/sql-editor-lifecycle'

/**
 * Whether a notebook has edits worth discarding on close: anything not yet
 * saved, except a never-persisted notebook that's still empty (nothing to
 * lose by closing it).
 */
export function hasDiscardableChanges(
  stateNotebook: StateNotebook | Snapshot<StateNotebook> | undefined
): boolean {
  if (!hasUnsavedChanges(stateNotebook?.status)) return false

  const isEmptyNewNotebook =
    stateNotebook?.status === 'new' && (stateNotebook.notebook.content?.cells.length ?? 0) === 0
  return !isEmptyNewNotebook
}

/**
 * Evicts a notebook from the React Query cache and the Valtio store together.
 * Applies to a persisted notebook (always safe to refetch) and to a dirty
 * unsaved notebook (safe once the caller has confirmed discarding it).
 *
 * Removes the query entry outright rather than invalidating it: a mounted
 * `useNotebookQuery` observer would otherwise read the stale cached value
 * synchronously, before its refetch lands, and `notebooksState.setNotebook`'s
 * merge guard would treat that stale merge as already-loaded and drop the
 * real update.
 *
 * @returns A boolean indicating whether the notebook was successfully evicted
 *          from the cache.
 */
export async function evictNotebookFromCaches({
  queryClient,
  projectRef,
  id,
}: {
  queryClient: QueryClient
  projectRef: string
  id: string
}): Promise<boolean> {
  const stateNotebook = notebooksState.notebooks[id]
  const canEvict = stateNotebook?.status === 'saved' || hasDiscardableChanges(stateNotebook)
  if (!canEvict) return false

  notebooksState.removeNotebook({ id })
  queryClient.removeQueries({ queryKey: contentKeys.resource(projectRef, id) })

  return true
}
