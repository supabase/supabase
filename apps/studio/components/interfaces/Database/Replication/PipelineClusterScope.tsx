import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { parseAsString, useQueryState } from 'nuqs'
import type { PropsWithChildren } from 'react'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { toRequestClusterId } from './PipelineClusterScope.utils'
import { replicationClustersQueryOptions } from '@/data/replication/clusters-query'
import { IS_PLATFORM } from '@/lib/constants'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'

/** The cluster in the `cluster_id` URL parameter, or `undefined` for the default cluster. */
export const useUrlReplicationClusterId = () => {
  const [requestedClusterId] = useQueryState('cluster_id', parseAsString)
  const { data } = useQuery(replicationClustersQueryOptions())
  return toRequestClusterId(requestedClusterId, data?.default_cluster_id)
}

export const PipelineClusterScope = ({ children }: PropsWithChildren) => {
  const { ref: projectRef } = useParams()
  const { isPending } = useQuery(replicationClustersQueryOptions())

  if (IS_PLATFORM && isPending) {
    return (
      <div className="p-6">
        <GenericSkeletonLoader />
      </div>
    )
  }

  return <PipelineRequestStatusProvider key={projectRef}>{children}</PipelineRequestStatusProvider>
}
