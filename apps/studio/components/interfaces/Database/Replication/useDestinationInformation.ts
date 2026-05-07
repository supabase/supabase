import { useParams } from 'common'

import { DestinationType } from './DestinationPanel/DestinationPanel.types'
import { getStatusName } from './Pipeline.utils'
import { useReplicationDestinationByIdQuery } from '@/data/replication/destination-by-id-query'
import { useReplicationPipelineStatusQuery } from '@/data/replication/pipeline-status-query'
import { useReplicationPipelinesQuery } from '@/data/replication/pipelines-query'
import { useReplicationSourcesQuery } from '@/data/replication/sources-query'

export const useDestinationInformation = ({ id }: { id?: number | null }) => {
  const { ref: projectRef } = useParams()

  const { data: sourcesData, isSuccess: isSourcesSuccess } = useReplicationSourcesQuery({
    projectRef,
  })
  const sourceId = sourcesData?.sources.find((s) => s.name === projectRef)?.id
  const replicationNotEnabled = isSourcesSuccess && !sourceId

  const {
    data: destination,
    error: destinationError,
    isPending: isDestinationPending,
    isError: isDestinationError,
    isSuccess: isDestinationSuccess,
  } = useReplicationDestinationByIdQuery({
    projectRef,
    destinationId: id,
  })
  const destinationType: DestinationType | undefined = !destination
    ? undefined
    : 'big_query' in destination.config
      ? 'BigQuery'
      : 'iceberg' in destination.config
        ? 'Analytics Bucket'
        : undefined

  const {
    data: pipelinesData,
    error: pipelineError,
    isPending: isPipelinePending,
    isError: isPipelineError,
    isSuccess: isPipelineSuccess,
  } = useReplicationPipelinesQuery({ projectRef })
  const pipeline = pipelinesData?.pipelines.find((p) => p.destination_id === id)

  const { data: pipelineStatus } = useReplicationPipelineStatusQuery({
    projectRef,
    pipelineId: pipeline?.id,
  })
  const statusName = getStatusName(pipelineStatus?.status)

  return {
    sourceId,
    destination,
    pipeline,
    pipelineStatus,
    // Derivatives
    statusName,
    type: destinationType,
    replicationNotEnabled,
    // Data fetching status (Secondary information)
    pipelineFetcher: {
      error: pipelineError,
      isPending: isPipelinePending,
      isError: isPipelineError,
      isSuccess: isPipelineSuccess,
    },
    destinationFetcher: {
      error: destinationError,
      isPending: isDestinationPending,
      isError: isDestinationError,
      isSuccess: isDestinationSuccess,
    },
  }
}
