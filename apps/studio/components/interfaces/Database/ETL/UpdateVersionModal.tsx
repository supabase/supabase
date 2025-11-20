import { toast } from 'sonner'

import { useParams } from 'common'
import { useReplicationPipelineStatusQuery } from 'data/etl/pipeline-status-query'
import { useReplicationPipelineVersionQuery } from 'data/etl/pipeline-version-query'
import { Pipeline } from 'data/etl/pipelines-query'
import { useRestartPipelineHelper } from 'data/etl/restart-pipeline-helper'
import { useUpdatePipelineVersionMutation } from 'data/etl/update-pipeline-version-mutation'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from 'state/replication-pipeline-request-status'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { getStatusName } from './Pipeline.utils'
import { PipelineStatusName, STATUS_REFRESH_FREQUENCY_MS } from './Replication.constants'

interface UpdateVersionModalProps {
  visible: boolean
  pipeline?: Pipeline
  confirmLabel?: string
  confirmLabelLoading?: string
  onClose: () => void
}

export const UpdateVersionModal = ({
  visible,
  pipeline,
  confirmLabel,
  confirmLabelLoading = 'Updating',
  onClose,
}: UpdateVersionModalProps) => {
  const { ref: projectRef } = useParams()
  const { setRequestStatus } = usePipelineRequestStatus()

  const { data: pipelineStatusData } = useReplicationPipelineStatusQuery(
    { projectRef, pipelineId: pipeline?.id },
    { refetchInterval: STATUS_REFRESH_FREQUENCY_MS }
  )
  const pipelineStatus = pipelineStatusData?.status
  const statusName = getStatusName(pipelineStatus)
  const isStopped = statusName === PipelineStatusName.STOPPED

  const { data: versionData } = useReplicationPipelineVersionQuery({
    projectRef,
    pipelineId: pipeline?.id,
  })
  const currentVersionName = versionData?.version?.name
  const newVersionName = versionData?.new_version?.name

  const { mutateAsync: updatePipelineVersion } = useUpdatePipelineVersionMutation()
  const { restartPipeline } = useRestartPipelineHelper()

  const onConfirmUpdate = async () => {
    if (!projectRef || !pipeline?.id) return
    const versionId = versionData?.new_version?.id
    if (!versionId) return

    // Step 1: Update to the new version
    try {
      await updatePipelineVersion({ projectRef, pipelineId: pipeline.id, versionId })
    } catch (e: any) {
      // 404: default changed; version cache will refresh via mutation onError. Keep dialog open.
      if (e?.code === 404) return
      // Other errors are already toasted by the mutation; do not double-toast here.
      return
    }

    // Step 2: Reflect optimistic restart (only if not stopped) and close any panels
    if (!isStopped) {
      setRequestStatus(pipeline.id, PipelineStatusRequestStatus.RestartRequested, statusName)

      // Step 3: Restart the pipeline (stop + start)
      try {
        await restartPipeline({ projectRef, pipelineId: pipeline.id })
        toast.success('Pipeline successfully updated and is currently restarting')
      } catch (e: any) {
        // Clear optimistic state and surface a single concise error
        setRequestStatus(pipeline.id, PipelineStatusRequestStatus.None)
        toast.error('Failed to restart pipeline')
      }
    } else {
      toast.success('Pipeline successfully updated')
    }

    onClose()
  }

  return (
    <ConfirmationModal
      size="medium"
      visible={visible}
      title="Update pipeline image"
      confirmLabel={confirmLabel ?? (isStopped ? 'Update image' : 'Update and restart')}
      confirmLabelLoading={confirmLabelLoading}
      onCancel={onClose}
      onConfirm={onConfirmUpdate}
      alert={
        !isStopped
          ? {
              base: { variant: 'warning' },
              title: 'Pipeline will restart to apply the new image',
              description: (
                <div className="flex flex-col gap-y-1">
                  <p className="!leading-normal">
                    The pipeline will briefly pause and resume with the new image version.
                    Replication will continue from where it left off.
                  </p>
                  <p className="!leading-normal">
                    If a long-running transaction is in progress, some records may be reprocessed
                    due to PostgreSQL logical replication behavior.
                  </p>
                </div>
              ),
            }
          : undefined
      }
    >
      <div className="flex flex-col gap-y-3">
        <p className="text-sm text-foreground">
          A new pipeline image is available with improvements and bug fixes.
        </p>
        <div className="text-sm text-foreground">
          <span className="text-foreground-light">Current version:</span>{' '}
          <code className="text-xs">{currentVersionName ?? 'Unknown'}</code>
        </div>
        <div className="text-sm text-foreground">
          <span className="text-foreground-light">New version:</span>{' '}
          <code className="text-xs">{newVersionName ?? 'Unknown'}</code>
        </div>
        {!isStopped ? (
          <div className="flex flex-col gap-y-2">
            <p className="text-sm text-foreground-light">
              The pipeline will automatically restart to apply the update. Your replication will
              continue without data loss.
            </p>
          </div>
        ) : (
          <div className="bg-surface-100 border border-border-stronger rounded-md p-3">
            <p className="text-sm text-foreground-light">
              <strong className="text-foreground">Pipeline is stopped:</strong> The image update
              will be applied, but the pipeline will remain stopped. You'll need to manually start
              the pipeline when you're ready to resume replication.
            </p>
          </div>
        )}
      </div>
    </ConfirmationModal>
  )
}
