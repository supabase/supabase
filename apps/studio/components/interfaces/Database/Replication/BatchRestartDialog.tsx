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
  const isPipelineStatusUnavailable = pipelineStatusName === undefined

  const copiedTables = useMemo(
    () => getTableCopyTargets(affectedTables, tableSyncCopy),
    [affectedTables, tableSyncCopy]
  )
  const pipelineAction = pipelineStatusName === PipelineStatusName.STOPPED ? 'start' : 'restart'

  const { mutateAsync: rollbackTables, isPending: isResetting } = useRollbackTablesMutation({
    onSuccess: (data) => {
      const count = data.tables.length
      toast.success(
        `Resetting ${count} table${count > 1 ? 's' : ''}. Pipeline will ${pipelineAction} automatically.`
      )
    },
    onSettled: () => {
      onRestartComplete?.(affectedTableIds)
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`Failed to reset tables: ${error.message}`)
    },
  })

  const handleReset = async () => {
    if (!projectRef) return toast.error('Project ref is required')
    if (isPipelineStatusUnavailable) return

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

  const count = affectedTables.length
  const tableWord = count === 1 ? 'table' : 'tables'
  const remainingTableCount = count - copiedTables.length
  const remainingTableWord = remainingTableCount === 1 ? 'table' : 'tables'
  const initialSyncDescription =
    copiedTables.length === 0
      ? 'Initial sync is skipped, so replication resumes with new changes only.'
      : copiedTables.length === affectedTables.length
        ? 'Existing rows will sync again.'
        : `${copiedTables.length} of ${count} ${tableWord} will sync existing rows again. The remaining ${remainingTableCount} ${remainingTableWord} will skip initial sync and resume with new changes only.`

  const dialogContent =
    mode === 'all'
      ? {
          title: 'Reset all tables',
          description: `This resets all ${count} ${tableWord}. Destination data will be deleted. ${initialSyncDescription} The pipeline will ${pipelineAction} automatically.`,
          action: 'Reset all tables',
        }
      : {
          title: 'Reset failed tables',
          description: `This resets ${count} failed ${tableWord}. Destination data for those tables will be deleted. ${initialSyncDescription} The pipeline will ${pipelineAction} automatically. Other tables stay as they are.`,
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
          <AlertDialogAction
            disabled={isResetting || isPipelineStatusUnavailable}
            onClick={handleReset}
            variant="warning"
          >
            {isResetting ? 'Resetting…' : dialogContent.action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
