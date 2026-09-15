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
import { usePipelineRequestStatus } from '@/state/replication-pipeline-request-status'

interface RestartTableDialogProps {
  pipelineStatusName?: PipelineStatusName
  open: boolean
  onOpenChange: (open: boolean) => void
  table: ReplicationTableIdentity
  tableSyncCopy?: TableSyncCopyConfig | null
  sourceId?: number
  publicationName?: string
}

export const RestartTableDialog = ({
  open,
  onOpenChange,
  table,
  tableSyncCopy,
  sourceId,
  publicationName,
  pipelineStatusName,
}: RestartTableDialogProps) => {
  const { ref: projectRef, pipelineId: _pipelineId } = useParams()
  const pipelineId = Number(_pipelineId)
  const { runWithRequestStatus } = usePipelineRequestStatus()
  const tableName = `${table.schema}.${table.name}`
  const willCopyTable = shouldCopyTable(tableSyncCopy, table.id)

  const { mutateAsync: rollbackTables, isPending: isResetting } = useRollbackTablesMutation({
    onSuccess: () => {
      toast.success(`Replication will restart for "${tableName}".`)
    },
    onSettled: () => {
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`Failed to restart replication: ${error.message}`)
    },
  })

  const handleReset = async () => {
    if (!projectRef) return toast.error('Project ref is required')
    if (!pipelineId) return toast.error('Pipeline ID is required')

    try {
      await runWithRequestStatus(pipelineId, getRestartRequestStatus(pipelineStatusName), () =>
        rollbackTables({
          projectRef,
          pipelineId,
          target: { type: 'single_table', table_id: table.id },
        })
      )
    } catch (error) {}
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Restart replication for <code className="text-code-inline">{tableName}</code>
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p>
                This will restart replication for{' '}
                <code className="text-code-inline">{tableName}</code>:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                {willCopyTable ? (
                  <li>
                    <strong>All existing rows will be copied again.</strong> Data successfully
                    processed during this initial sync is billed again.
                  </li>
                ) : (
                  <li>
                    <strong>The table will skip initial sync.</strong> Replication will resume with
                    new changes only, without syncing existing rows in your database. There is no
                    additional initial sync charge.
                  </li>
                )}
                <li>
                  <strong>Existing downstream data will be deleted.</strong> Any replicated data for
                  this table will be removed.
                </li>
                <li>
                  <strong>Other tables keep their replication progress.</strong> Only this table
                  restarts.
                </li>
                <li>
                  <strong>Running pipelines restart automatically.</strong> Stopped pipelines remain
                  stopped and must be started to resume replication.
                </li>
              </ul>
            </div>
          </AlertDialogDescription>
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
            {isResetting ? 'Preparing to restart replication...' : 'Restart'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
