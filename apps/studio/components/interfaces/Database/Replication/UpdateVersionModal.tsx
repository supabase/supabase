import { toast } from 'sonner'

import { useParams } from 'common'
import { useReplicationPipelineStatusQuery } from 'data/replication/pipeline-status-query'
import { useReplicationPipelineVersionQuery } from 'data/replication/pipeline-version-query'
import { Pipeline } from 'data/replication/pipelines-query'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useUpdatePipelineVersionMutation } from 'data/replication/update-pipeline-version-mutation'
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
  confirmLabel = 'Update and restart',
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

  const { data: versionData } = useReplicationPipelineVersionQuery({
    projectRef,
    pipelineId: pipeline?.id,
  })
  const currentVersionName = versionData?.version?.name
  const newVersionName = versionData?.new_version?.name

  const { mutateAsync: updatePipelineVersion } = useUpdatePipelineVersionMutation()
  const { mutateAsync: startPipeline } = useStartPipelineMutation()

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

    // Step 2: Reflect optimistic restart (only if currently active) and close any panels
    const isActive =
      statusName === PipelineStatusName.STARTED || statusName === PipelineStatusName.FAILED

    if (isActive) {
      setRequestStatus(pipeline.id, PipelineStatusRequestStatus.RestartRequested, statusName)

      // Step 3: Restart the pipeline
      try {
        await startPipeline({ projectRef, pipelineId: pipeline.id })
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
      title="Update pipeline version"
      confirmLabel={confirmLabel}
      confirmLabelLoading={confirmLabelLoading}
      onCancel={onClose}
      onConfirm={onConfirmUpdate}
      alert={{
        base: { variant: 'warning' },
        title: 'Pipeline will be restarted briefly to complete the change',
        description: (
          <div className="flex flex-col gap-y-1">
            <p className="!leading-normal">
              During the update process, the replication pauses and resumes.
            </p>
            <p className="!leading-normal">
              If a long‑running transaction is in progress, some records may be reprocessed due to
              PostgreSQL logical replication limitations.
            </p>
          </div>
        ),
      }}
    >
      <p className="text-sm text-foreground prose max-w-full mb-1">
        Pipeline will be updated from <code>{currentVersionName ?? 'Current version'}</code> to{' '}
        <code>{newVersionName ?? 'New version'}</code>.
      </p>
      <p className="text-sm">Confirm to update pipeline? This action cannot be undone.</p>
    </ConfirmationModal>
  )
}
