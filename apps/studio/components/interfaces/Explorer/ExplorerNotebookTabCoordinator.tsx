import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { useContext, useEffect } from 'react'

import { evictNotebookFromCaches } from '@/data/content/notebooks/notebook-cache'
import { TabsStateContext } from '@/state/tabs'

/**
 * Evicts a notebook's content from the valtio store and the React Query cache
 * when its tab closes, so reopening it always refetches instead of showing
 * whatever was last loaded. Only applies to notebooks with no unsaved edits —
 * a dirty notebook is left in the store untouched, same as today, since there's
 * no autosave or discard-confirmation flow for notebooks yet.
 *
 * [Joshen] We'll address discard confirmation separately
 */
export const ExplorerNotebookTabCoordinator = () => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const tabs = useContext(TabsStateContext)

  useEffect(() => {
    return tabs.registerTabTypeHandler('notebook', {
      onClose: (tab) => {
        const notebookId = tab.metadata?.notebookId
        if (!ref || !notebookId) return

        evictNotebookFromCaches({ queryClient, projectRef: ref, id: notebookId, mode: 'remove' })
      },
    })
  }, [ref, tabs, queryClient])

  return null
}
