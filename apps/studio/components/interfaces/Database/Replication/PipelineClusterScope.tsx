import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { parseAsString, useQueryState } from 'nuqs'
import type { PropsWithChildren } from 'react'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { PipelineClusterSelector } from './PipelineClusterSelector'
import { replicationClustersQueryOptions } from '@/data/replication/clusters-query'
import { IS_PLATFORM } from '@/lib/constants'
import { ReplicationClusterProvider } from '@/state/replication-cluster'
import { PipelineRequestStatusProvider } from '@/state/replication-pipeline-request-status'

export const PipelineClusterScope = ({ children }: PropsWithChildren) => {
  const { ref: projectRef } = useParams()
  const [requestedClusterId] = useQueryState('cluster_id', parseAsString)
  const { data: clusters, isPending } = useQuery(replicationClustersQueryOptions())
  const clusterId = requestedClusterId ?? clusters?.default_cluster_id

  if (IS_PLATFORM && !clusters) {
    return (
      <div className="p-6">
        {isPending && <GenericSkeletonLoader />}
        {!isPending && <PipelineClusterSelector />}
      </div>
    )
  }

  return (
    <ReplicationClusterProvider clusterId={clusterId}>
      <PipelineRequestStatusProvider key={`${projectRef}:${clusterId}`}>
        {children}
      </PipelineRequestStatusProvider>
    </ReplicationClusterProvider>
  )
}
