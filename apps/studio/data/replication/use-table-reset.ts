import { useState } from 'react'
import { toast } from 'sonner'
import { useRestartPipelineHelper } from './restart-pipeline-helper'
import { RollbackType, useRollbackTableMutation } from './rollback-table-mutation'

interface UseTableResetParams {
  tableName: string
  onSuccess?: () => void
  onError?: (error: Error) => void
}

/**
 * Custom hook that encapsulates the logic for resetting a table and restarting the pipeline.
 * Provides unified error handling and loading states for table reset operations.
 */
export const useTableReset = ({ tableName, onSuccess, onError }: UseTableResetParams) => {
  const [isRestartingPipeline, setIsRestartingPipeline] = useState(false)
  const { restartPipeline } = useRestartPipelineHelper()

  const { mutate: rollbackTable, isPending: isRollingBack } = useRollbackTableMutation({
    onSuccess: async (_, vars) => {
      const { projectRef, pipelineId } = vars
      toast.success(`Table "${tableName}" reset successfully and pipeline is being restarted`)

      setIsRestartingPipeline(true)
      try {
        await restartPipeline({ projectRef, pipelineId })
        toast.success('Pipeline restarted successfully')
        onSuccess?.()
      } catch (error: any) {
        const errorMessage = `Failed to restart pipeline: ${error.message}`
        toast.error(errorMessage)
        onError?.(new Error(errorMessage))
      } finally {
        setIsRestartingPipeline(false)
      }
    },
    onError: (error) => {
      const errorMessage = `Failed to reset table: ${error.message}`
      toast.error(errorMessage)
      onError?.(new Error(errorMessage))
    },
  })

  const resetTable = ({
    projectRef,
    pipelineId,
    tableId,
    rollbackType = 'full' as RollbackType,
  }: {
    projectRef: string
    pipelineId: number
    tableId: number
    rollbackType?: RollbackType
  }) => {
    rollbackTable({
      projectRef,
      pipelineId,
      tableId,
      rollbackType,
    })
  }

  return {
    resetTable,
    isRollingBack,
    isRestartingPipeline,
    isResetting: isRollingBack || isRestartingPipeline,
  }
}
