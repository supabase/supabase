import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { RollbackType, useRollbackTableMutation } from 'data/etl/rollback-table-mutation'
import { useRestartPipelineHelper } from 'data/etl/restart-pipeline-helper'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from 'ui'

interface ResetTableButtonProps {
  tableId: number
  tableName: string
}

export const ResetTableButton = ({ tableId, tableName }: ResetTableButtonProps) => {
  const { ref: projectRef, pipelineId: _pipelineId } = useParams()
  const [isOpen, setIsOpen] = useState(false)
  const [isRestartingPipeline, setIsRestartingPipeline] = useState(false)

  const { restartPipeline } = useRestartPipelineHelper()

  const { mutate: rollbackTable, isLoading: isRollingBack } = useRollbackTableMutation({
    onSuccess: async (_, vars) => {
      const { projectRef, pipelineId } = vars
      toast.success(`Table "${tableName}" reset successfully and pipeline is being restarted`)

      setIsRestartingPipeline(true)
      try {
        await restartPipeline({ projectRef, pipelineId })
        toast.success('Pipeline restarted successfully')
      } catch (error: any) {
        toast.error(`Failed to restart pipeline: ${error.message}`)
      } finally {
        setIsRestartingPipeline(false)
        setIsOpen(false)
      }
    },
    onError: (error) => {
      toast.error(`Failed to reset table: ${error.message}`)
      setIsOpen(false)
    },
  })

  const isLoading = isRollingBack || isRestartingPipeline

  const handleReset = () => {
    if (!projectRef) return toast.error('Project ref is required')
    if (!_pipelineId) return toast.error('Pipeline ID is required')

    const pipelineId = Number(_pipelineId)

    rollbackTable({
      projectRef,
      pipelineId,
      tableId,
      rollbackType: 'full',
    })
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        size="tiny"
        type="default"
        loading={isLoading}
        disabled={isLoading}
        className="w-min"
        icon={<RotateCcw />}
        aria-label={`Reset and restart table ${tableName}`}
        onClick={() => setIsOpen(true)}
      >
        Reset Table and Restart
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset and restart table "{tableName}"?</AlertDialogTitle>
          <AlertDialogDescription className="flex flex-col gap-y-3">
            <p>
              This will reset and restart replication for this table only. The table will start
              copying from scratch, and any existing data for this table downstream will be
              deleted.
            </p>
            <p className="text-foreground-light">
              Other tables in the pipeline will not be affected. Only this table will be restarted
              and go through the full replication process again, starting with the initial copy
              phase.
            </p>
            <p className="text-foreground-light">
              The pipeline will be restarted to apply the table reset.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isLoading}
            onClick={handleReset}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isLoading ? 'Resetting...' : 'Reset Table and Restart'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
