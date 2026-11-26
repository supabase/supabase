import { useParams } from 'common'

import { getStatusName } from './Pipeline.utils'
import { getReplicationDestinationType } from './ReplicationDiagram/Nodes.utils'
import { useReplicationDestinationByIdQuery } from '@/data/replication/destination-by-id-query'
import { useReplicationPipelineStatusQuery } from '@/data/replication/pipeline-status-query'
import { useReplicationPipelinesQuery } from '@/data/replication/pipelines-query'
import { useReplicationSourcesQuery } from '@/data/replication/sources-query'

export const useDestinationInformation = ({
  id,
  clusterId,
}: {
  id?: number | null
  /** The cluster this destination belongs to. `undefined` means the default cluster. */
  clusterId: string | undefined
}) => {
  const { ref: projectRef } = useParams()

  const { data: sourcesData, isSuccess: isSourcesSuccess } = useReplicationSourcesQuery({
    projectRef,
    clusterId,
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
    clusterId,
    destinationId: id,
  })
  const destinationType = getReplicationDestinationType(destination?.config)

  const {
    data: pipelinesData,
    error: pipelineError,
    isPending: isPipelinePending,
    isError: isPipelineError,
    isSuccess: isPipelineSuccess,
  } = useReplicationPipelinesQuery({ projectRef, clusterId })
  const pipeline = pipelinesData?.pipelines.find((p) => p.destination_id === id)

  const { data: pipelineStatus } = useReplicationPipelineStatusQuery({
    projectRef,
    clusterId,
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
