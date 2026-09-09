import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { useContext, useEffect } from 'react'
import type { Snapshot } from 'valtio'

import {
  evictNotebookFromCaches,
  hasDiscardableChanges,
} from '@/data/content/notebooks/notebook-cache'
import { hasNotebookDraft } from '@/state/notebooks/notebook-drafts'
import { notebooksState, useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'
import type { StateNotebook } from '@/state/notebooks/types'
import { TabsStateContext, type Tab } from '@/state/tabs'

function isNotebookTabDirty({
  stateNotebook,
  ref,
  notebookId,
}: {
  stateNotebook: StateNotebook | Snapshot<StateNotebook> | undefined
  ref: string | undefined
  notebookId: string | undefined
}): boolean {
  if (!notebookId) return false
  if (stateNotebook) return hasDiscardableChanges(stateNotebook)

  return !!ref && hasNotebookDraft({ projectRef: ref, id: notebookId })
}

const NotebookTabStatusIndicator = ({ tab }: { tab: Tab }) => {
  const { ref } = useParams()
  const notebooksSnap = useNotebooksStateSnapshot()
  const notebookId = tab.metadata?.notebookId
  const stateNotebook = notebookId ? notebooksSnap.notebooks[notebookId] : undefined

  if (!isNotebookTabDirty({ stateNotebook, ref, notebookId })) return null

  return (
    <span
      role="img"
      aria-label="Unsaved changes"
      className="block size-2 shrink-0 rounded-full bg-warning"
    />
  )
}

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
          return isNotebookTabDirty({
            stateNotebook: notebookId ? notebooksState.notebooks[notebookId] : undefined,
            ref,
            notebookId,
          })
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
