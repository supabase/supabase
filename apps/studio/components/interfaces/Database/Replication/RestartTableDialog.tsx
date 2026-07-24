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
import {
  shouldCopyTable,
  type ReplicationTableIdentity,
  type TableSyncCopyConfig,
} from './TableSyncCopy.utils'
import { useRollbackTablesMutation } from '@/data/replication/rollback-tables-mutation'

interface RestartTableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: ReplicationTableIdentity
  tableSyncCopy?: TableSyncCopyConfig
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

  const { mutate: rollbackTables, isPending: isResetting } = useRollbackTablesMutation({
    onSuccess: () => {
      toast.success(
        `Restarting replication for "${tableName}". Pipeline will ${pipelineStatusName === PipelineStatusName.STOPPED ? 'start' : 'restart'} automatically.`
      )
    },
    onSettled: () => {
      onRestartComplete?.()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`Failed to restart replication: ${error.message}`)
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
                <code className="text-code-inline">{tableName}</code> from scratch:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                {willCopyTable ? (
                  <li>
                    <strong>The table's initial sync will restart.</strong> All existing data will
                    be copied again from the source. This initial sync is billed in addition to
                    previous initial syncs.
                  </li>
                ) : (
                  <li>
                    <strong>No initial copy will run.</strong> New changes will resume streaming
                    without backfilling existing source rows. There is no additional initial-copy
                    charge.
                  </li>
                )}
                <li>
                  <strong>Existing downstream data will be deleted.</strong> Any replicated data for
                  this table will be removed.
                </li>
                <li>
                  <strong>All other tables remain untouched.</strong> Only this table is affected.
                </li>
                <li>
                  <strong>The pipeline will restart automatically.</strong> This is required to
                  apply this change.
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
            {isResetting ? 'Restarting replication...' : 'Restart replication'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
