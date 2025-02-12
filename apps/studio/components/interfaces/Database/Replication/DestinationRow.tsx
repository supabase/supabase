import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ReplicationPipelinesData } from 'data/replication/pipelines-query'
import { ResponseError } from 'types'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import RowMenu from './RowMenu'
import PipelineStatus from './PipelineStatus'
import { useParams } from 'common'
import { useReplicationPipelineStatusQuery } from 'data/replication/pipeline-status-query'
import { useState } from 'react'
import { toast } from 'sonner'
import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { useStopPipelineMutation } from 'data/replication/stop-pipeline-mutation'

export type Pipeline = ReplicationPipelinesData['pipelines'][0]

interface DestinationRowProps {
  sink_name: string
  type: string
  pipeline: Pipeline | undefined
  error: ResponseError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean
}

const DestinationRow = ({
  sink_name,
  type,
  pipeline,
  error: pipelineError,
  isLoading: isPipelineLoading,
  isError: isPipelineError,
  isSuccess: isPipelineSuccess,
}: DestinationRowProps) => {
  const { ref: projectRef } = useParams()
  const [refetchInterval, setRefetchInterval] = useState<number | false>(false)
  const {
    data: pipelineStatusData,
    error: pipelineStatusError,
    isLoading: isPipelineStatusLoading,
    isError: isPipelineStatusError,
    isSuccess: isPipelineStatusSuccess,
  } = useReplicationPipelineStatusQuery(
    {
      projectRef,
      pipelineId: pipeline?.id,
    },
    { refetchInterval }
  )
  const [requestStatus, setRequestStatus] = useState<
    'None' | 'EnableRequested' | 'DisableRequested'
  >('None')
  const { mutate: startPipeline } = useStartPipelineMutation()
  const { mutate: stopPipeline } = useStopPipelineMutation()
  const pipelineStatus = pipelineStatusData?.status
  if (
    (requestStatus === 'EnableRequested' && pipelineStatus === 'Started') ||
    (requestStatus === 'DisableRequested' && pipelineStatus === 'Stopped')
  ) {
    setRefetchInterval(false)
    setRequestStatus('None')
  }

  const onEnableClick = () => {
    if (!projectRef || !pipeline) return

    startPipeline({ projectRef, pipelineId: pipeline.id })
    setRequestStatus('EnableRequested')
    setRefetchInterval(5000)
  }
  const onDisableClick = () => {
    if (!projectRef || !pipeline) return

    stopPipeline({ projectRef, pipelineId: pipeline.id })
    setRequestStatus('DisableRequested')
    setRefetchInterval(5000)
  }

  return (
    <>
      {isPipelineError && (
        <AlertError error={pipelineError} subject="Failed to retrieve pipeline" />
      )}
      {isPipelineSuccess && (
        <Table.tr>
          <Table.td>
            {isPipelineLoading ? <ShimmeringLoader></ShimmeringLoader> : sink_name}
          </Table.td>
          <Table.td>{isPipelineLoading ? <ShimmeringLoader></ShimmeringLoader> : type}</Table.td>
          <Table.td>
            {isPipelineLoading || !pipeline ? (
              <ShimmeringLoader></ShimmeringLoader>
            ) : (
              <PipelineStatus
                pipelineStatus={pipelineStatusData?.status}
                error={pipelineStatusError}
                isLoading={isPipelineStatusLoading}
                isError={isPipelineStatusError}
                isSuccess={isPipelineStatusSuccess}
                requestStatus={requestStatus}
              ></PipelineStatus>
            )}
          </Table.td>
          <Table.td>
            {isPipelineLoading || !pipeline ? (
              <ShimmeringLoader></ShimmeringLoader>
            ) : (
              pipeline.publication_name
            )}
          </Table.td>
          <Table.td>
            {pipeline && (
              <RowMenu
                pipelineStatus={pipelineStatusData?.status}
                error={pipelineStatusError}
                isLoading={isPipelineStatusLoading}
                isError={isPipelineStatusError}
                isSuccess={isPipelineStatusSuccess}
                onEnableClick={onEnableClick}
                onDisableClick={onDisableClick}
              ></RowMenu>
            )}
          </Table.td>
        </Table.tr>
      )}
    </>
  )
}

export default DestinationRow
