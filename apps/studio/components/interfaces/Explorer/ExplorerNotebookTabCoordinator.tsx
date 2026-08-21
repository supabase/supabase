import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { useContext, useEffect } from 'react'

import { contentKeys } from '@/data/content/keys'
import { notebooksState, useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'
import { hasUnsavedChanges } from '@/state/sql-editor/sql-editor-lifecycle'
import { TabsStateContext, type Tab } from '@/state/tabs'

const NotebookTabStatusIndicator = ({ tab }: { tab: Tab }) => {
  const notebooksSnap = useNotebooksStateSnapshot()
  const notebookId = tab.metadata?.notebookId
  const status = notebookId ? notebooksSnap.notebooks[notebookId]?.status : undefined
  if (!hasUnsavedChanges(status)) return null

  return (
    <span
      role="img"
      aria-label="Unsaved changes"
      className="block size-2 shrink-0 rounded-full bg-warning"
    />
  )
}

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

        const stateNotebook = notebooksState.notebooks[notebookId]
        if (stateNotebook?.status !== 'saved') return

        notebooksState.removeNotebook({ id: notebookId })
        queryClient.removeQueries({ queryKey: contentKeys.resource(ref, notebookId) })
      },
      StatusIndicator: NotebookTabStatusIndicator,
    })
  }, [ref, tabs, queryClient])

  return null
}
