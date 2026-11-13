import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { parseAsString, useQueryState } from 'nuqs'
import type { PropsWithChildren } from 'react'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  replicationClustersQueryOptions,
  toRequestClusterId,
} from '@/data/replication/clusters-query'
import { IS_PLATFORM } from '@/lib/constants'
import { ReplicationClusterProvider } from '@/state/replication-cluster'
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
  const clusterId = useUrlReplicationClusterId()

  if (IS_PLATFORM && isPending) {
    return (
      <div className="p-6">
        <GenericSkeletonLoader />
      </div>
    )
  }

  return (
    <ReplicationClusterProvider clusterId={clusterId}>
      <PipelineRequestStatusProvider key={projectRef}>{children}</PipelineRequestStatusProvider>
    </ReplicationClusterProvider>
  )
}
