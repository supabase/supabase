import { useOperationQueueActions } from './useOperationQueueActions'
import { useIsQueueOperationsEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useHotKey } from '@/hooks/ui/useHotKey'
import { useTableEditorStateSnapshot } from '@/state/table-editor'

/**
 * Hook that provides keyboard shortcuts for the operation queue.
 *
 * Shortcuts:
 * - Cmd/Ctrl + S: Save all pending changes
 * - Cmd/Ctrl + .: Toggle the operation queue side panel
 *
 * These shortcuts are registered on the capture phase to ensure they fire
 * before the data grid handles the keyboard event.
 */
export function useOperationQueueShortcuts() {
  const isQueueOperationsEnabled = useIsQueueOperationsEnabled()
  const snap = useTableEditorStateSnapshot()
  const { handleSave } = useOperationQueueActions()

  const isSaving = snap.operationQueue.status === 'saving'
  const hasOperations = snap.hasPendingOperations
  const isEnabled = isQueueOperationsEnabled && hasOperations

  useHotKey(
    (event) => {
      event.preventDefault()
      event.stopPropagation()
      if (!isSaving && hasOperations) {
        handleSave()
      }
    },
    's',
    { enabled: isEnabled }
  )

  useHotKey(
    (event) => {
      event.preventDefault()
      event.stopPropagation()
      snap.toggleViewOperationQueue()
    },
    '.',
    { enabled: isEnabled }
  )
}
