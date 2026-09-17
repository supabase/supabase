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

import { PipelineStatusName } from './Replication.constants'
import { RestartCostEstimate } from './RestartCostEstimate'
import { shouldCopyTable, type ReplicationTableIdentity } from './TableSyncCopy.utils'
import { useRollbackTablesMutation } from '@/data/replication/rollback-tables-mutation'
import type { TableSyncCopyConfig } from '@/data/replication/types'

interface RestartTableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: ReplicationTableIdentity
  tableSyncCopy?: TableSyncCopyConfig | null
  sourceId?: number
  publicationName?: string
  pipelineStatusName?: PipelineStatusName
  onRestartStart?: () => void
  onRestartComplete?: () => void
}

export const RestartTableDialog = ({
  open,
  onOpenChange,
  table,
  tableSyncCopy,
  sourceId,
  publicationName,
  pipelineStatusName,
  onRestartStart,
  onRestartComplete,
}: RestartTableDialogProps) => {
  const { ref: projectRef, pipelineId: _pipelineId } = useParams()
  const pipelineId = Number(_pipelineId)
  const tableName = `${table.schema}.${table.name}`
  const willCopyTable = shouldCopyTable(tableSyncCopy, table.id)
  const pipelineAction = pipelineStatusName === PipelineStatusName.STOPPED ? 'start' : 'restart'

  const { mutate: rollbackTables, isPending: isResetting } = useRollbackTablesMutation({
    onSuccess: () => {
      toast.success(`Resetting "${tableName}". Pipeline will ${pipelineAction} automatically.`)
    },
    onSettled: () => {
      onRestartComplete?.()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`Failed to reset table: ${error.message}`)
    },
  })

  const handleReset = () => {
    if (!projectRef) return toast.error('Project ref is required')
    if (!pipelineId) return toast.error('Pipeline ID is required')

    onRestartStart?.()
    rollbackTables({
      projectRef,
      pipelineId,
      target: { type: 'single_table', table_id: table.id },
      rollbackType: 'full',
      pipelineStatusName,
    })
  }

  const consequence = willCopyTable
    ? `Destination data for this table will be deleted, existing rows will sync again, and the pipeline will ${pipelineAction} automatically.`
    : `Destination data for this table will be deleted. Initial sync is skipped for this table, so replication resumes with new changes only. The pipeline will ${pipelineAction} automatically.`

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
