import { toast } from 'sonner'

import { useParams } from 'common'
import { useReplicationPipelineStatusQuery } from 'data/replication/pipeline-status-query'
import { useReplicationPipelineVersionQuery } from 'data/replication/pipeline-version-query'
import { Pipeline } from 'data/replication/pipelines-query'
import { useRestartPipelineHelper } from 'data/replication/restart-pipeline-helper'
import { useUpdatePipelineVersionMutation } from 'data/replication/update-pipeline-version-mutation'
import { ChevronDown } from 'lucide-react'
import {
  PipelineStatusRequestStatus,
  usePipelineRequestStatus,
} from 'state/replication-pipeline-request-status'
import {
  Collapsible_Shadcn_,
  CollapsibleContent_Shadcn_,
  CollapsibleTrigger_Shadcn_,
  DialogSectionSeparator,
} from 'ui'
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
      size="small"
      visible={visible}
      title="Update pipeline image"
      className="!p-0"
      confirmLabel={confirmLabel ?? (isStopped ? 'Update image' : 'Update and restart')}
      confirmLabelLoading={confirmLabelLoading}
      onCancel={onClose}
      onConfirm={onConfirmUpdate}
    >
      <div className="flex flex-col gap-y-3 py-4 px-5">
        <p className="text-sm text-foreground">
          A new pipeline image is available with improvements and bug fixes. Proceed to update?
        </p>
        {!isStopped && (
          <p className="text-sm text-foreground-light">
            The pipeline will automatically restart when updating. Replication will continue from
            where it left off.
          </p>
        )}
      </div>
      <DialogSectionSeparator />

      <Collapsible_Shadcn_ className="px-5 py-3 group">
        <CollapsibleTrigger_Shadcn_ className="w-full flex items-center justify-between text-sm text-foreground-light">
          <p>View version update details</p>
          <ChevronDown size={14} className="group-data-[state=open]:-rotate-180 transition" />
        </CollapsibleTrigger_Shadcn_>
        <CollapsibleContent_Shadcn_>
          <div className="flex flex-col gap-y-2 mt-2 pb-2">
            <div className="text-sm text-foreground prose max-w-full">
              <p className="text-foreground-light mb-1">Current version:</p>{' '}
              <code className="text-code-inline">{currentVersionName ?? 'Unknown'}</code>
            </div>
            <div className="text-sm text-foreground prose max-w-full">
              <p className="text-foreground-light mb-1">New version:</p>{' '}
              <code className="text-code-inline">{newVersionName ?? 'Unknown'}</code>
            </div>
          </div>
        </CollapsibleContent_Shadcn_>
      </Collapsible_Shadcn_>
    </ConfirmationModal>
  )
}
