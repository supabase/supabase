import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { useContext, useEffect } from 'react'

import {
  evictNotebookFromCaches,
  hasDiscardableChanges,
} from '@/data/content/notebooks/notebook-cache'
import { hasNotebookDraft } from '@/state/notebooks/notebook-drafts'
import { notebooksState, useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'
import { TabsStateContext, type Tab } from '@/state/tabs'

const NotebookTabStatusIndicator = ({ tab }: { tab: Tab }) => {
  const notebooksSnap = useNotebooksStateSnapshot()
  const notebookId = tab.metadata?.notebookId
  const stateNotebook = notebookId ? notebooksSnap.notebooks[notebookId] : undefined
  if (!hasDiscardableChanges(stateNotebook)) return null

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

        evictNotebookFromCaches({ queryClient, projectRef: ref, id: notebookId })
      },
      confirmClose: (notebookTabs) => {
        const dirtyCount = notebookTabs.filter((tab) => {
          const notebookId = tab.metadata?.notebookId
          if (!notebookId) return false

          const stateNotebook = notebooksState.notebooks[notebookId]
          if (stateNotebook) return hasDiscardableChanges(stateNotebook)

          // The notebook was never loaded into the store this session (e.g. a background
          // tab left over from before a refresh), so there's no status to check — fall
          // back to whether a local draft for it exists at all.
          return !!ref && hasNotebookDraft({ projectRef: ref, id: notebookId })
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
