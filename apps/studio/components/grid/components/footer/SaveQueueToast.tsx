import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useOperationQueueShortcuts } from 'components/grid/hooks/useOperationQueueShortcuts'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { SaveQueueToastContent } from './SaveQueueToast.Content'

const SAVE_QUEUE_TOAST_ID = 'table-editor-save-queue-toast'

interface SaveQueueToastProps {
  onSave: () => void
}

export const SaveQueueToast = ({ onSave }: SaveQueueToastProps) => {
  const snap = useTableEditorStateSnapshot()
  const toastShownRef = useRef(false)
  const operationCount = snap.operationQueue.operations.length
  const isSaving = snap.operationQueue.status === 'saving'
  const isOperationQueuePanelOpen = snap.sidePanel?.type === 'operation-queue'

  useOperationQueueShortcuts({
    enabled: snap.hasPendingOperations,
    onSave,
    onTogglePanel: () => snap.onViewOperationQueue(),
    isSaving,
    hasOperations: operationCount > 0,
  })

  useEffect(() => {
    if (snap.hasPendingOperations && !isOperationQueuePanelOpen) {
      toast(
        <SaveQueueToastContent
          count={operationCount}
          isSaving={isSaving}
          onSave={onSave}
          onViewDetails={() => snap.onViewOperationQueue()}
        />,
        {
          id: SAVE_QUEUE_TOAST_ID,
          duration: Infinity,
          position: 'bottom-center',
          dismissible: false,
        }
      )
      toastShownRef.current = true
    } else if ((!snap.hasPendingOperations || isOperationQueuePanelOpen) && toastShownRef.current) {
      toast.dismiss(SAVE_QUEUE_TOAST_ID)
      toastShownRef.current = false
    }
  }, [snap.hasPendingOperations, operationCount, isSaving, onSave, snap, isOperationQueuePanelOpen])

  // Dismiss toast when component unmounts (e.g., navigating away from table editor)
  useEffect(() => {
    return () => {
      toast.dismiss(SAVE_QUEUE_TOAST_ID)
    }
  }, [])

  // This component doesn't render anything visible itself
  // It only manages the toast lifecycle
  return null
}
