import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ReplicationPipelinesData } from 'data/replication/pipelines-query'
import { ResponseError } from 'types'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import RowMenu from './RowMenu'
import PipelineStatus from './PipelineStatus'
import { useParams } from 'common'
import { useReplicationPipelineStatusQuery } from 'data/replication/pipeline-status-query'

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
  const {
    data: pipelineStatusData,
    error: pipelineStatusError,
    isLoading: isPipelineStatusLoading,
    isError: isPipelineStatusError,
    isSuccess: isPipelineStatusSuccess,
  } = useReplicationPipelineStatusQuery({
    projectRef,
    pipelineId: pipeline?.id,
  })

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
              ></RowMenu>
            )}
          </Table.td>
        </Table.tr>
      )}
    </>
  )
}

export default DestinationRow
