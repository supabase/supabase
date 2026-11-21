import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { toast } from 'sonner'

import { tableRowKeys } from '@/data/table-rows/keys'
import { useOperationQueueSaveMutation } from '@/data/table-rows/operation-queue-save-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useGetImpersonatedRoleState } from '@/state/role-impersonation-state'
import { useTableEditorStateSnapshot } from '@/state/table-editor'
import { QueuedOperation } from '@/state/table-editor-operation-queue.types'

interface UseOperationQueueActionsOptions {
  onCancelSuccess?: () => void
}

/**
 * Hook that provides save and cancel actions for the operation queue.
 * Consolidates the logic used by both the useSaveQueueToast hook and OperationQueueSidePanel.
 */
export function useOperationQueueActions(options: UseOperationQueueActionsOptions = {}) {
  const { onCancelSuccess } = options

  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const snap = useTableEditorStateSnapshot()
  const getImpersonatedRoleState = useGetImpersonatedRoleState()

  const { mutate: saveOperationQueue, isPending: isMutationPending } =
    useOperationQueueSaveMutation({
      onSuccess: () => {
        const hasPendingOperations = snap.finishQueueSave(true)
        toast.success(
          hasPendingOperations
            ? 'Batch saved. More changes are pending.'
            : 'Changes saved successfully'
        )
      },
      onError: (error) => {
        snap.finishQueueSave(false)
        toast.error(`Failed to save changes: ${error.message}`)
      },
    })

  const isSaving = snap.operationQueue.status === 'saving' || isMutationPending
  const handleSave = useCallback(() => {
    if (!project) return
    const operations = snap.startQueueSave()
    if (!operations) return

    saveOperationQueue({
      projectRef: project.ref,
      connectionString: project.connectionString,
      operations,
      roleImpersonationState: getImpersonatedRoleState(),
    })
  }, [snap, project, saveOperationQueue, getImpersonatedRoleState])

  const handleCancel = useCallback(() => {
    // Get unique table IDs from the queue before clearing
    const operations = snap.operationQueue.operations as readonly QueuedOperation[]
    const tableIds = [...new Set(operations.map((op) => op.tableId))]

    // Clear the queue and invalidate queries to revert optimistic updates
    if (!snap.clearQueue()) return
    if (project) {
      // Invalidate queries for each table that had pending operations
      tableIds.forEach((tableId) => {
        queryClient.invalidateQueries({
          queryKey: tableRowKeys.tableRowsAndCount(project.ref, tableId),
        })
      })
    }
    onCancelSuccess?.()
  }, [snap, project, queryClient, onCancelSuccess])

  return {
    handleSave,
    handleCancel,
    isSaving,
  }
}
