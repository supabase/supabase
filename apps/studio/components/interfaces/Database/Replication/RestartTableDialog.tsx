import { useParams } from 'common'
import { toast } from 'sonner'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

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
        `Resetting "${tableName}". Pipeline will ${pipelineStatusName === PipelineStatusName.STOPPED ? 'start' : 'restart'} automatically.`
      )
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
    ? 'Destination data for this table will be deleted, existing rows will sync again, and the pipeline will restart automatically.'
    : 'Destination data for this table will be deleted. Initial sync is skipped for this table, so replication resumes with new changes only. The pipeline will restart automatically.'

  return (
    <ConfirmationModal
      size="small"
      variant="warning"
      visible={open}
      title={`Reset ${tableName}`}
      confirmLabel="Reset table"
      confirmLabelLoading="Resetting…"
      loading={isResetting}
      onCancel={() => onOpenChange(false)}
      onConfirm={handleReset}
    >
      <div className="flex flex-col gap-y-4">
        <p className="text-sm text-foreground-light">{consequence}</p>
        <RestartCostEstimate
          open={open}
          projectRef={projectRef}
          sourceId={sourceId}
          publicationName={publicationName}
          tables={willCopyTable ? [table] : []}
        />
      </div>
    </ConfirmationModal>
  )
}
