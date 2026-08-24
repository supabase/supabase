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
  const stateNotebook = notebookId ? notebooksSnap.notebooks[notebookId] : undefined
  if (!hasUnsavedChanges(stateNotebook?.status)) return null

  // A never-persisted notebook with no cells has nothing worth flagging as unsaved.
  const isEmptyNewNotebook =
    stateNotebook?.status === 'new' && (stateNotebook.notebook.content?.cells.length ?? 0) === 0
  if (isEmptyNewNotebook) return null

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
 * whatever was last loaded. Unsaved edits are discarded the same way — safe
 * because `confirmClose` below has already asked the user to confirm.
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

        if (notebooksState.notebooks[notebookId]) {
          notebooksState.removeNotebook({ id: notebookId })
        }

        notebooksState.removeNotebook({ id: notebookId })
        queryClient.removeQueries({ queryKey: contentKeys.resource(ref, notebookId) })
      },
      confirmClose: (notebookTabs) => {
        const dirtyCount = notebookTabs.filter((tab) => {
          const notebookId = tab.metadata?.notebookId
          if (!notebookId) return false

          const stateNotebook = notebooksState.notebooks[notebookId]
          if (!hasUnsavedChanges(stateNotebook?.status)) return false

          // A never-persisted notebook with no cells has nothing worth confirming before discarding.
          const isEmptyNewNotebook =
            stateNotebook?.status === 'new' &&
            (stateNotebook.notebook.content?.cells.length ?? 0) === 0
          return !isEmptyNewNotebook
        }).length

        if (dirtyCount === 0) return null

        return {
          title: 'Unsaved changes',
          description:
            dirtyCount === 1
              ? 'You have unsaved changes in this notebook. Closing it will discard them.'
              : `You have unsaved changes in ${dirtyCount} notebooks. Closing them will discard those changes.`,
        }
      },
      StatusIndicator: NotebookTabStatusIndicator,
    })
  }, [ref, tabs, queryClient])

  return null
}
