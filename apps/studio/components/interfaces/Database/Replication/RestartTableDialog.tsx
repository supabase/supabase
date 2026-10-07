import { useParams } from 'common'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'ui'

import { getRestartRequestStatus } from './Pipeline.utils'
import type { PipelineStatusName } from './Replication.constants'
import { RestartCostEstimate } from './RestartCostEstimate'
import { shouldCopyTable, type ReplicationTableIdentity } from './TableSyncCopy.utils'
import { useRollbackTablesMutation } from '@/data/replication/rollback-tables-mutation'
import type { TableSyncCopyConfig } from '@/data/replication/types'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'

interface RestartTableDialogProps {
  pipelineStatusName?: PipelineStatusName
  open: boolean
  onOpenChange: (open: boolean) => void
  table: ReplicationTableIdentity
  tableSyncCopy?: TableSyncCopyConfig | null
  sourceId?: number
  publicationName?: string
  onResetStart?: (tableId: number) => void
  onResetComplete?: (tableId: number) => void
}

export const RestartTableDialog = ({
  open,
  onOpenChange,
  table,
  tableSyncCopy,
  sourceId,
  publicationName,
  pipelineStatusName,
  onResetStart,
  onResetComplete,
}: RestartTableDialogProps) => {
  const { ref: projectRef, pipelineId: _pipelineId } = useParams()
  const pipelineId = Number(_pipelineId)
  const { runWithRequestStatus } = usePipelineRequestStatus()
  const restartRequestStatus = getRestartRequestStatus(pipelineStatusName)
  const tableName = `${table.schema}.${table.name}`
  const willCopyTable = shouldCopyTable(tableSyncCopy, table.id)
  const { mutateAsync: rollbackTables, isPending: isResetting } = useRollbackTablesMutation({
    onSuccess: () => {
      toast.success(`Resetting "${tableName}"`)
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`Failed to reset table: ${error.message}`)
    },
  })

  const handleReset = async () => {
    if (!projectRef) return toast.error('Project ref is required')
    if (!pipelineId) return toast.error('Pipeline ID is required')
    onResetStart?.(table.id)

    try {
      await runWithRequestStatus(pipelineId, restartRequestStatus, () =>
        rollbackTables({
          projectRef,
          pipelineId,
          target: { type: 'single_table', table_id: table.id },
        })
      )
    } finally {
      onResetComplete?.(table.id)
    }
  }

  const resetDescription = willCopyTable
    ? 'This resets the table, deletes its destination data, and syncs existing rows again.'
    : 'This resets the table and deletes its destination data. Initial sync is skipped, so replication resumes with new changes only.'
  const shouldRestartPipeline = restartRequestStatus !== PipelineStatusRequestStatus.None
  const consequence = shouldRestartPipeline
    ? `${resetDescription} The pipeline restarts automatically to apply the reset.`
    : resetDescription

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset {tableName}</AlertDialogTitle>
          <AlertDialogDescription>{consequence}</AlertDialogDescription>
        </AlertDialogHeader>
        <RestartCostEstimate
          open={open}
          projectRef={projectRef}
          sourceId={sourceId}
          publicationName={publicationName}
          tables={willCopyTable ? [table] : []}
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isResetting} onClick={handleReset} variant="warning">
            {isResetting ? 'Resetting…' : 'Reset table'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
