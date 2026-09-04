import { useParams } from 'common'
import { toast } from 'sonner'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { getStatusName } from './Pipeline.utils'
import { PipelineStatusName, STATUS_REFRESH_FREQUENCY_MS } from './Replication.constants'
import { useReplicationPipelineStatusQuery } from '@/data/replication/pipeline-status-query'
import { useReplicationPipelineVersionQuery } from '@/data/replication/pipeline-version-query'
import { Pipeline } from '@/data/replication/pipelines-query'
import { useUpdatePipelineVersionMutation } from '@/data/replication/update-pipeline-version-mutation'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'
import { type ResponseError } from '@/types'

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
  confirmLabelLoading = 'Updating…',
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
  // Treat an unresolved/unknown status as stopped so we don't optimistically claim a restart
  // for a pipeline whose active state hasn't been confirmed yet.
  const isStopped = statusName === undefined || statusName === PipelineStatusName.STOPPED

  const { data: versionData, isPending: isLoadingVersion } = useReplicationPipelineVersionQuery({
    projectRef,
    pipelineId: pipeline?.id,
  })
  const currentVersionName = versionData?.version?.name
  const newVersionName = versionData?.new_version?.name

  const { mutateAsync: updatePipelineVersion, isPending: isUpdating } =
    useUpdatePipelineVersionMutation()

  const onConfirmUpdate = async () => {
    if (!projectRef || !pipeline?.id) return
    const versionId = versionData?.new_version?.id
    if (!versionId) return

    try {
      await updatePipelineVersion({ projectRef, pipelineId: pipeline.id, versionId })
    } catch (e) {
      // 404: default changed; version cache will refresh via mutation onError. Keep dialog open.
      if ((e as ResponseError)?.code === 404) return
      return
    }

    if (!isStopped) {
      setRequestStatus(pipeline.id, PipelineStatusRequestStatus.RestartRequested, statusName)
      toast.success('Pipeline successfully updated and is currently restarting')
    } else {
      toast.success('Pipeline successfully updated')
    }

    onClose()
  }

  const resolvedConfirmLabel = confirmLabel ?? (isStopped ? 'Update version' : 'Update and restart')

  return (
    <ConfirmationModal
      size="small"
      variant={isStopped ? 'default' : 'warning'}
      visible={visible}
      title="Update available"
      confirmLabel={resolvedConfirmLabel}
      confirmLabelLoading={confirmLabelLoading}
      loading={isUpdating}
      onCancel={onClose}
      onConfirm={onConfirmUpdate}
    >
      <div className="flex flex-col gap-y-3">
        <p className="text-sm text-foreground-light">
          {isStopped
            ? 'A newer pipeline version is available with improvements and bug fixes.'
            : 'A newer pipeline version is available with improvements and bug fixes. The pipeline will restart and continue from where it left off.'}
        </p>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b">
                <td className="px-3 py-2 text-foreground-lighter">Current</td>
                <td className="px-3 py-2 text-right text-foreground" translate="no">
                  {isLoadingVersion ? 'Loading…' : (currentVersionName ?? 'Unknown')}
                </td>
              </tr>
              <tr>
                <td className="px-3 py-2 text-foreground-lighter">New</td>
                <td className="px-3 py-2 text-right text-foreground" translate="no">
                  {isLoadingVersion ? 'Loading…' : (newVersionName ?? 'Unknown')}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ConfirmationModal>
  )
}
