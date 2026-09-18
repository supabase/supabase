import { useParams } from 'common'
import { toast } from 'sonner'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

import { getRestartRequestStatus, getStatusName } from './Pipeline.utils'
import { useReplicationPipelineStatusQuery } from '@/data/replication/pipeline-status-query'
import { useReplicationPipelineVersionQuery } from '@/data/replication/pipeline-version-query'
import { Pipeline } from '@/data/replication/pipelines-query'
import { useUpdatePipelineVersionMutation } from '@/data/replication/update-pipeline-version-mutation'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from '@/state/replication-pipeline-request-status'

interface UpdateVersionModalProps {
  visible: boolean
  pipeline?: Pipeline
  onClose: () => void
}

export const UpdateVersionModal = ({ visible, pipeline, onClose }: UpdateVersionModalProps) => {
  const { ref: projectRef } = useParams()
  const { runWithRequestStatus } = usePipelineRequestStatus()

  const { data: pipelineStatusData } = useReplicationPipelineStatusQuery({
    projectRef,
    pipelineId: pipeline?.id,
  })
  const pipelineStatus = pipelineStatusData?.status
  const statusName = getStatusName(pipelineStatus)
  const requestStatus = getRestartRequestStatus(statusName)
  const shouldRestart = requestStatus === PipelineStatusRequestStatus.StopRequested

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
      await runWithRequestStatus(pipeline.id, requestStatus, () =>
        updatePipelineVersion({
          projectRef,
          pipelineId: pipeline.id,
          versionId,
          skipStatusInvalidation: true,
        })
      )
    } catch {
      // The mutation reports errors and refreshes version info if the default image changed.
      return
    }

    toast.success('Pipeline version updated.')

    onClose()
  }

  return (
    <ConfirmationModal
      size="small"
      variant={shouldRestart ? 'warning' : 'default'}
      visible={visible}
      title="Update available"
      confirmLabel={shouldRestart ? 'Update and restart' : 'Update version'}
      confirmLabelLoading="Updating version..."
      loading={isUpdating}
      onCancel={onClose}
      onConfirm={onConfirmUpdate}
    >
      <div className="flex flex-col gap-y-3">
        <p className="text-sm text-foreground-light">
          {shouldRestart
            ? 'A newer pipeline version is available with improvements and bug fixes. The pipeline will restart and continue from where it left off.'
            : 'A newer pipeline version is available with improvements and bug fixes.'}
        </p>
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <tbody aria-live="polite" aria-atomic="true">
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
