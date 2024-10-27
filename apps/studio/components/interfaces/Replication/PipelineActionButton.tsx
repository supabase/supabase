import { useReplicationPipelineStatusQuery } from 'data/replication/pipeline-status-query'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useStopPipelineMutation } from 'data/replication/stop-pipeline-mutation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

export type PipelineActionButtonProps = {
  projectRef: string
  pipelineId: number
}

export const PipelineActionButton = ({ projectRef, pipelineId }: PipelineActionButtonProps) => {
  const [refetchInterval, setRefetchInterval] = useState<number | false>(false)
  const { data: status } = useReplicationPipelineStatusQuery(
    { projectRef, pipelineId },
    { refetchInterval }
  )
  const [requestStatus, setRequestStatus] = useState<'None' | 'StartRequested' | 'StopRequested'>(
    'None'
  )
  const { mutate: startPipeline } = useStartPipelineMutation({
    onSuccess: (res) => {
      toast.success('Start pipeline request submitted. Pipeline will start shortly')
    },
  })
  const { mutate: stopPipeline } = useStopPipelineMutation({
    onSuccess: () => {
      toast.success('Stop pipeline request submitted. Pipeline will stop shortly')
    },
  })
  const actionButtonLoading =
    requestStatus === 'StartRequested' || requestStatus === 'StopRequested'
  const pipelineStatus = status?.status
  const buttonLabel =
    requestStatus === 'StartRequested'
      ? 'Starting'
      : requestStatus === 'StopRequested'
        ? 'Stopping'
        : pipelineStatus === 'Started'
          ? 'Stop'
          : pipelineStatus === 'Stopped'
            ? 'Start'
            : 'Loading Status'
  if (
    (requestStatus === 'StartRequested' && pipelineStatus === 'Started') ||
    (requestStatus === 'StopRequested' && pipelineStatus === 'Stopped')
  ) {
    setRefetchInterval(false)
    setRequestStatus('None')
  }
  return (
    <Button
      onClick={() => {
        if (buttonLabel === 'Start') {
          startPipeline({ projectRef, pipelineId })
          setRequestStatus('StartRequested')
        } else if (buttonLabel === 'Stop') {
          stopPipeline({ projectRef, pipelineId })
          setRequestStatus('StopRequested')
        }
        setRefetchInterval(3000)
      }}
      loading={actionButtonLoading}
    >
      {buttonLabel}
    </Button>
  )
}
