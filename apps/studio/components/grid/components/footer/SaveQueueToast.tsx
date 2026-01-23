import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

import { useOperationQueueShortcuts } from 'components/grid/hooks/useOperationQueueShortcuts'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { SaveQueueToastContent } from './SaveQueueToast.Content'

const SAVE_QUEUE_TOAST_ID = 'table-editor-save-queue-toast'

interface SaveQueueToastProps {
  onSave: () => void
  onCancel: () => void
}

/**
 * Component that manages a persistent toast notification when there are
 * pending operations in the table editor queue.
 *
 * Shows the count of pending changes along with "View Details", "Save", and "Cancel" buttons.
 * Automatically dismisses when the queue is empty.
 */
export const SaveQueueToast = ({ onSave, onCancel }: SaveQueueToastProps) => {
  const snap = useTableEditorStateSnapshot()
  const toastShownRef = useRef(false)
  const operationCount = snap.operationQueue.operations.length
  const isSaving = snap.operationQueue.status === 'saving'

  useOperationQueueShortcuts({
    enabled: snap.hasPendingOperations,
    onSave,
    onTogglePanel: () => snap.onViewOperationQueue(),
    isSaving,
    hasOperations: operationCount > 0,
  })

  useEffect(() => {
    if (snap.hasPendingOperations) {
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
    } else if (!snap.hasPendingOperations && toastShownRef.current) {
      toast.dismiss(SAVE_QUEUE_TOAST_ID)
      toastShownRef.current = false
    }
  }, [snap.hasPendingOperations, operationCount, isSaving, onSave, onCancel, snap])

  // This component doesn't render anything visible itself
  // It only manages the toast lifecycle
  return null
}
