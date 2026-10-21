import { useParams } from 'common'
import { useMemo } from 'react'
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
import { getTableCopyTargets } from './TableSyncCopy.utils'
import { ReplicationPipelineTableStatus } from '@/data/replication/pipeline-replication-status-query'
import { useRollbackTablesMutation } from '@/data/replication/rollback-tables-mutation'
import type { TableSyncCopyConfig } from '@/data/replication/types'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'

interface BatchRestartDialogProps {
  pipelineStatusName?: PipelineStatusName
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'all' | 'errored'
  tables: ReplicationPipelineTableStatus[]
  sourceId?: number
  publicationName?: string
  tableSyncCopy?: TableSyncCopyConfig | null
  onResetStart?: (tableIds: number[]) => void
  onResetComplete?: (tableIds: number[]) => void
}

export const BatchRestartDialog = ({
  open,
  onOpenChange,
  mode,
  tables,
  sourceId,
  publicationName,
  tableSyncCopy,
  pipelineStatusName,
  onResetStart,
  onResetComplete,
}: BatchRestartDialogProps) => {
  const { ref: projectRef, pipelineId: _pipelineId } = useParams()
  const pipelineId = Number(_pipelineId)
  const { runWithRequestStatus } = usePipelineRequestStatus()
  const restartRequestStatus = getRestartRequestStatus(pipelineStatusName)
  const affectedTables = useMemo(() => {
    if (mode === 'all') {
      return tables
    } else {
      return tables.filter((table) => table.state.name === 'error')
    }
  }, [mode, tables])
  const affectedTableIds = affectedTables.map((table) => table.id)
  const copiedTables = useMemo(
    () => getTableCopyTargets(affectedTables, tableSyncCopy),
    [affectedTables, tableSyncCopy]
  )
  const { mutateAsync: rollbackTables, isPending: isResetting } = useRollbackTablesMutation({
    onSuccess: (data) => {
      const count = data.tables.length
      toast.success(`Resetting ${count} table${count > 1 ? 's' : ''}`)
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`Failed to reset tables: ${error.message}`)
    },
  })

  const handleReset = async () => {
    if (!projectRef) return toast.error('Project ref is required')
    onResetStart?.(affectedTableIds)
    try {
      await runWithRequestStatus(pipelineId, restartRequestStatus, () =>
        rollbackTables({
          projectRef,
          pipelineId,
          target: mode === 'all' ? { type: 'all_tables' } : { type: 'all_errored_tables' },
        })
      )
    } finally {
      onResetComplete?.(affectedTableIds)
    }
  }

  const count = affectedTables.length
  const tableWord = count === 1 ? 'table' : 'tables'
  const remainingTableCount = count - copiedTables.length
  let resetScope = `${count} failed ${tableWord}`
  if (mode === 'all') {
    resetScope = count === 1 ? 'the table' : `all ${count} tables`
  }
  const destinationData = count === 1 ? 'its destination data' : 'their destination data'

  let resetDescription = `This resets ${resetScope} and deletes ${destinationData}. Initial sync is skipped, so replication resumes with new changes only.`
  if (copiedTables.length === affectedTables.length) {
    resetDescription = `This resets ${resetScope}, deletes ${destinationData}, and syncs existing rows again.`
  } else if (copiedTables.length > 0) {
    const remainingTables =
      remainingTableCount === 1
        ? 'the remaining table'
        : `the remaining ${remainingTableCount} tables`
    const remainingAction = remainingTableCount === 1 ? 'skips' : 'skip'
    resetDescription = `This resets ${resetScope} and deletes ${destinationData}. Existing rows sync again for ${copiedTables.length} of ${count} ${tableWord}, while ${remainingTables} ${remainingAction} initial sync and resume with new changes only.`
  }

  const shouldRestartPipeline = restartRequestStatus !== PipelineStatusRequestStatus.None
  const description = shouldRestartPipeline
    ? `${resetDescription} The pipeline restarts automatically to apply the reset.`
    : resetDescription

  const dialogContent =
    mode === 'all'
      ? {
          title: 'Reset all tables',
          description,
          action: 'Reset all tables',
        }
      : {
          title: 'Reset failed tables',
          description,
          action: 'Reset failed tables',
        }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
          <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <RestartCostEstimate
          open={open}
          projectRef={projectRef}
          sourceId={sourceId}
          publicationName={publicationName}
          tables={copiedTables}
        />
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isResetting} onClick={handleReset} variant="warning">
            {isResetting ? 'Resetting…' : dialogContent.action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
