import type { QueryClient } from '@tanstack/react-query'

import { contentKeys } from '@/data/content/keys'
import { notebooksState } from '@/state/notebooks/notebooks-state'

export type NotebookCacheEvictionMode = 'refresh' | 'remove'

/**
 * Evicts a notebook from the React Query cache and the Valtio store together.
 *
 * @returns A boolean indicating whether the notebook was successfully evicted
 *          from the cache.
 */
export async function evictNotebookFromCaches({
  queryClient,
  projectRef,
  id,
  mode,
}: {
  queryClient: QueryClient
  projectRef: string
  id: string
  mode: NotebookCacheEvictionMode
}): Promise<boolean> {
  if (notebooksState.notebooks[id]?.status !== 'saved') return false

  notebooksState.removeNotebook({ id })

  const queryKey = contentKeys.resource(projectRef, id)
  if (mode === 'remove') {
    queryClient.removeQueries({ queryKey })
  } else {
    await queryClient.invalidateQueries({ queryKey })
  }

  return true
}
