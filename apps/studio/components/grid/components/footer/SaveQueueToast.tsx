import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

import { useTableEditorStateSnapshot } from 'state/table-editor'

const SAVE_QUEUE_TOAST_ID = 'table-editor-save-queue-toast'

interface SaveQueueToastProps {
  onSave: () => void
  onCancel: () => void
}

/**
 * Component that manages a persistent toast notification when there are
 * pending operations in the table editor queue.
 *
 * Shows "Save" and "Cancel" buttons when the queue has pending operations,
 * and automatically dismisses when the queue is empty.
 */
export const SaveQueueToast = ({ onSave, onCancel }: SaveQueueToastProps) => {
  const snap = useTableEditorStateSnapshot()
  const toastShownRef = useRef(false)

  useEffect(() => {
    if (snap.hasPendingOperations && !toastShownRef.current) {
      toast(
        <div className="flex items-center gap-2">
          <span className="text-sm">Save</span>
          <div className="flex items-center gap-1">
            <Button size="tiny" type="primary" onClick={onSave}>
              Save
            </Button>
            <Button size="tiny" type="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>,
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
  }, [snap.hasPendingOperations, onSave, onCancel])

  // This component doesn't render anything visible itself
  // It only manages the toast lifecycle
  return null
}
