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

import { PipelineStatusName } from './Replication.constants'
import { RestartCostEstimate } from './RestartCostEstimate'
import { getTableCopyTargets, type TableSyncCopyConfig } from './TableSyncCopy.utils'
import { ReplicationPipelineTableStatus } from '@/data/replication/pipeline-replication-status-query'
import { useRollbackTablesMutation } from '@/data/replication/rollback-tables-mutation'

interface BatchRestartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'all' | 'errored'
  tables: ReplicationPipelineTableStatus[]
  sourceId?: number
  publicationName?: string
  tableSyncCopy?: TableSyncCopyConfig
  pipelineStatusName?: PipelineStatusName
  onRestartStart?: (tableIds: number[]) => void
  onRestartComplete?: (tableIds: number[]) => void
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
  onRestartStart,
  onRestartComplete,
}: BatchRestartDialogProps) => {
  const { ref: projectRef, pipelineId: _pipelineId } = useParams()
  const pipelineId = Number(_pipelineId)
  const affectedTables = useMemo(() => {
    if (mode === 'all') {
      return tables
    } else {
      return tables.filter((table) => table.state.name === 'error')
    }
  }, [mode, tables])
  const affectedTableIds = useMemo(() => affectedTables.map((table) => table.id), [affectedTables])

  const copiedTables = useMemo(
    () => getTableCopyTargets(affectedTables, tableSyncCopy),
    [affectedTables, tableSyncCopy]
  )

  const initialSyncDescription =
    copiedTables.length === 0 ? (
      <li>
        <strong>No table will run an initial sync.</strong> Replication will resume with new changes
        only, without syncing existing source rows. There is no additional initial sync charge.
      </li>
    ) : copiedTables.length === affectedTables.length ? (
      <li>
        <strong>
          {copiedTables.length === 1
            ? 'The table will run its initial sync again.'
            : `All ${copiedTables.length} tables will run initial sync again.`}
        </strong>{' '}
        Existing source rows will be synced again. Data successfully processed during this initial
        sync is billed again.
      </li>
    ) : (
      <li>
        <strong>
          {copiedTables.length} of {affectedTables.length} tables will run initial sync again.
        </strong>{' '}
        Existing source rows for those tables will be synced again and billed again. The remaining
        tables will resume replication with new changes only.
      </li>
    )

  const { mutateAsync: rollbackTables, isPending: isResetting } = useRollbackTablesMutation({
    onSuccess: (data) => {
      const count = data.tables.length
      toast.success(
        `Restarting replication for ${count} table${count > 1 ? 's' : ''}. Pipeline will restart automatically.`
      )
    },
    onSettled: () => {
      onRestartComplete?.(affectedTableIds)
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`Failed to restart replication: ${error.message}`)
    },
  })

  const handleReset = async () => {
    if (!projectRef) return toast.error('Project ref is required')

    onRestartStart?.(affectedTableIds)

    try {
      await rollbackTables({
        projectRef,
        pipelineId,
        target: mode === 'all' ? { type: 'all_tables' } : { type: 'all_errored_tables' },
        rollbackType: 'full',
        pipelineStatusName,
      })
    } catch (error) {}
  }

  const dialogContent =
    mode === 'all'
      ? {
          title: 'Restart all tables',
          description: (
            <div className="space-y-3 text-sm">
              <p>
                This will restart replication for all {affectedTables.length} table
                {affectedTables.length === 1 ? '' : 's'} in this pipeline from scratch:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                {initialSyncDescription}
                <li>
                  <strong>All downstream data will be deleted.</strong> All replicated data will be
                  removed.
                </li>
                <li>
                  <strong>The pipeline will restart automatically.</strong> This is required to
                  apply this change.
                </li>
              </ul>
            </div>
          ),
          action: 'Restart all tables',
        }
      : {
          title: 'Restart failed tables',
          description: (
            <div className="space-y-3 text-sm">
              <p>
                This will restart replication for all{' '}
                <strong>{affectedTables.length} currently failed tables</strong> from scratch:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                {initialSyncDescription}
                <li>
                  <strong>Existing downstream data will be deleted.</strong> Replicated data for
                  these tables will be removed.
                </li>
                <li>
                  <strong>Tables that are not failed remain untouched.</strong> The request resets
                  every table that is failed when it runs.
                </li>
                <li>
                  <strong>The pipeline will restart automatically.</strong> This is required to
                  apply this change.
                </li>
              </ul>
            </div>
          ),
          action: 'Restart failed tables',
        }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
          <AlertDialogDescription asChild>{dialogContent.description}</AlertDialogDescription>
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
            {isResetting ? 'Restarting replication...' : dialogContent.action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
