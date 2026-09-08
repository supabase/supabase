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

import { RestartCostEstimate } from './RestartCostEstimate'
import { getTableCopyTargets } from './TableSyncCopy.utils'
import { ReplicationPipelineTableStatus } from '@/data/replication/pipeline-replication-status-query'
import { useRollbackTablesMutation } from '@/data/replication/rollback-tables-mutation'
import type { TableSyncCopyConfig } from '@/data/replication/types'

interface BatchRestartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'all' | 'errored'
  tables: ReplicationPipelineTableStatus[]
  sourceId?: number
  publicationName?: string
  tableSyncCopy?: TableSyncCopyConfig | null
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
        only, without syncing existing rows in your database. There is no additional initial sync
        charge.
      </li>
    ) : copiedTables.length === affectedTables.length ? (
      <li>
        <strong>
          {copiedTables.length === 1
            ? 'The table will run its initial sync again.'
            : `All ${copiedTables.length} tables will run initial sync again.`}
        </strong>{' '}
        Existing rows in your database will be synced again. Data successfully processed during this
        initial sync is billed again.
      </li>
    ) : (
      <li>
        <strong>
          {copiedTables.length} of {affectedTables.length} tables will run initial sync again.
        </strong>{' '}
        Existing rows in your database for those tables will be synced again and billed again. The
        remaining tables will resume replication with new changes only.
      </li>
    )

  const { mutateAsync: rollbackTables, isPending: isResetting } = useRollbackTablesMutation({
    onSuccess: (data) => {
      const count = data.tables.length
      toast.success(`${count} table${count > 1 ? 's' : ''} will replicate from scratch.`)
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
      })
    } catch (error) {}
  }

  const dialogContent =
    mode === 'all'
      ? {
          title: 'Restart all tables from scratch',
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
                  <strong>Running pipelines restart automatically.</strong> Stopped pipelines remain
                  stopped and must be started to resume replication.
                </li>
              </ul>
            </div>
          ),
          action: 'Restart from scratch',
        }
      : {
          title: 'Restart failed tables from scratch',
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
                  <strong>Tables that are not failed remain untouched.</strong> Replication restarts
                  for every table that is failed when the request runs.
                </li>
                <li>
                  <strong>Running pipelines restart automatically.</strong> Stopped pipelines remain
                  stopped and must be started to resume replication.
                </li>
              </ul>
            </div>
          ),
          action: 'Restart from scratch',
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
            {isResetting ? 'Preparing to replicate from scratch...' : dialogContent.action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
