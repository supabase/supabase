import { useParams } from 'common'
import { useRouter } from 'next/router'
import { createContext, useContext, useState, type PropsWithChildren } from 'react'
import { toast } from 'sonner'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { useContentDeleteMutation } from '@/data/content/content-delete-mutation'
import { useDashboardHistory } from '@/hooks/misc/useDashboardHistory'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

type ExplorerDeleteItem = { id: string; type: 'notebook' | 'chat'; name: string }

interface ExplorerContextValue {
  onSelectDelete: (item: ExplorerDeleteItem) => void
}

const ExplorerContext = createContext<ExplorerContextValue | undefined>(undefined)

export const useExplorerDeleteItem = () => {
  const context = useContext(ExplorerContext)
  if (!context) {
    throw new Error('useExplorerDeleteItem must be used within an ExplorerProvider')
  }
  return context
}

export const ExplorerProvider = ({ children }: PropsWithChildren) => {
  const router = useRouter()
  const { ref } = useParams()
  const tabs = useTabsStateSnapshot()
  const notebooksSnap = useNotebooksStateSnapshot()
  const aiAssistantSnap = useAiAssistantStateSnapshot()
  const { setLastVisitedExplorerTab } = useDashboardHistory()

  const [pending, setPending] = useState<ExplorerDeleteItem | null>(null)

  const onClearDashboardHistory = () => setLastVisitedExplorerTab(undefined)

  const closeTabForItem = (item: ExplorerDeleteItem) => {
    tabs.handleTabClose({
      id: createTabId(item.type, { id: item.id }),
      router,
      editor: 'explorer',
      onClearDashboardHistory,
    })
  }

  const { mutate: deleteNotebook, isPending: isDeletingNotebook } = useContentDeleteMutation({
    onSuccess: () => {
      if (!pending) return
      toast.success('Successfully deleted notebook')
      notebooksSnap.removeNotebook({ id: pending.id })
      closeTabForItem(pending)
      setPending(null)
    },
    onError: (error) => toast.error(`Failed to delete notebook: ${error.message}`),
  })

  const handleConfirm = () => {
    if (!pending) return

    if (pending.type === 'notebook') {
      if (!ref) return
      deleteNotebook({ projectRef: ref, ids: [pending.id] })
    } else {
      aiAssistantSnap.deleteChat(pending.id)
      toast.success(`Deleted "${pending.name}"`)
      closeTabForItem(pending)
      setPending(null)
    }
  }

  return (
    <ExplorerContext.Provider value={{ onSelectDelete: setPending }}>
      {children}

      <ConfirmationModal
        size="small"
        variant="destructive"
        visible={!!pending}
        title={`Confirm to delete ${pending?.type} '${pending?.name ?? ''}'`}
        confirmLabel={`Delete ${pending?.type}`}
        confirmLabelLoading="Deleting..."
        loading={isDeletingNotebook}
        onCancel={() => setPending(null)}
        onConfirm={handleConfirm}
      >
        <p className="text-sm text-foreground-light">
          This action cannot be undone. Are you sure you want to delete '{pending?.name}'?
        </p>
      </ConfirmationModal>
    </ExplorerContext.Provider>
  )
}
