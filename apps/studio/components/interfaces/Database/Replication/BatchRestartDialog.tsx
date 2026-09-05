import { useParams } from 'common'
import { useMemo } from 'react'
import { toast } from 'sonner'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

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

  const { mutateAsync: rollbackTables, isPending: isResetting } = useRollbackTablesMutation({
    onSuccess: (data) => {
      const count = data.tables.length
      toast.success(
        `Resetting ${count} table${count > 1 ? 's' : ''}. Pipeline will restart automatically.`
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

  const dialogContent =
    mode === 'all'
      ? {
          title: 'Reset all tables',
          description:
            copiedTables.length === 0
              ? `This resets all ${count} ${tableWord}. Destination data will be deleted, initial sync is skipped, and the pipeline will restart automatically.`
              : `This resets all ${count} ${tableWord}. Destination data will be deleted, existing rows will sync again, and the pipeline will restart automatically.`,
          action: 'Reset all tables',
        }
      : {
          title: 'Reset failed tables',
          description:
            copiedTables.length === 0
              ? `This resets ${count} failed ${tableWord}. Destination data for those tables will be deleted, initial sync is skipped, and the pipeline will restart automatically. Other tables stay as they are.`
              : `This resets ${count} failed ${tableWord}. Destination data for those tables will be deleted, existing rows will sync again, and the pipeline will restart automatically. Other tables stay as they are.`,
          action: 'Reset failed tables',
        }

  return (
    <ConfirmationModal
      size="small"
      variant="warning"
      visible={open}
      title={dialogContent.title}
      confirmLabel={dialogContent.action}
      confirmLabelLoading="Resetting…"
      loading={isResetting}
      onCancel={() => onOpenChange(false)}
      onConfirm={handleReset}
    >
      <div className="flex flex-col gap-y-4">
        <p className="text-sm text-foreground-light">{dialogContent.description}</p>
        <RestartCostEstimate
          open={open}
          projectRef={projectRef}
          sourceId={sourceId}
          publicationName={publicationName}
          tables={copiedTables}
        />
      </div>
    </ConfirmationModal>
  )
}
