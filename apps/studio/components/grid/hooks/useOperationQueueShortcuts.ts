import { useQueryClient } from '@tanstack/react-query'

import { useOperationQueueActions } from './useOperationQueueActions'
import { useIsQueueOperationsEnabled } from '@/components/interfaces/Account/Preferences/useDashboardSettings'
import { tableRowKeys } from '@/data/table-rows/keys'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'
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
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const isQueueOperationsEnabled = useIsQueueOperationsEnabled()
  const snap = useTableEditorStateSnapshot()
  const { handleSave } = useOperationQueueActions()

  const isSaving = snap.operationQueue.status === 'saving'
  const hasOperations = snap.hasPendingOperations
  const isEnabled = isQueueOperationsEnabled && hasOperations

  useShortcut(
    SHORTCUT_IDS.OPERATION_QUEUE_SAVE,
    () => {
      if (!isSaving && hasOperations) {
        handleSave()
      }
    },
    { enabled: isEnabled }
  )

  useShortcut(
    SHORTCUT_IDS.OPERATION_QUEUE_TOGGLE,
    () => {
      snap.toggleViewOperationQueue()
    },
    { enabled: isEnabled }
  )

  useShortcut(
    SHORTCUT_IDS.OPERATION_QUEUE_UNDO,
    () => {
      const tableIdLatestOperation = snap.operationQueue.operations.at(-1)?.tableId
      snap.undoLatestOperation()

      if (project && tableIdLatestOperation) {
        queryClient.invalidateQueries({
          queryKey: tableRowKeys.tableRowsAndCount(project.ref, tableIdLatestOperation),
        })
      }
    },
    { enabled: isEnabled }
  )
}
