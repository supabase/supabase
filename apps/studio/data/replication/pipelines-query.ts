import { useQuery } from '@tanstack/react-query'

import { replicationKeys } from './keys'
import { pipelineIdSchema } from './pipeline-id'
import { checkReplicationFeatureFlagRetry } from './utils'
import { get, handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import { useReplicationClusterId } from '@/state/replication-cluster'
import type { UseCustomQueryOptions } from '@/types'

type ReplicationPipelinesParams = { projectRef?: string; clusterId?: string }

async function fetchReplicationPipelines(
  { projectRef, clusterId }: ReplicationPipelinesParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/replication/{ref}/pipelines', {
    params: { path: { ref: projectRef }, query: { cluster_id: clusterId } },
    signal,
  })

  if (error) handleError(error)
  return {
    ...data,
    pipelines: data.pipelines.map((pipeline) => ({
      ...pipeline,
      id: pipelineIdSchema.parse(pipeline.id),
    })),
  }
}

export type ReplicationPipelinesData = Awaited<ReturnType<typeof fetchReplicationPipelines>>
export type Pipeline = ReplicationPipelinesData['pipelines'][0]

export const useReplicationPipelinesQuery = <TData = ReplicationPipelinesData>(
  { projectRef, clusterId: requestedClusterId }: ReplicationPipelinesParams,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ReplicationPipelinesData, StudioError, TData> = {}
) => {
  const clusterId = useReplicationClusterId(requestedClusterId)
  return useQuery<ReplicationPipelinesData, StudioError, TData>({
    queryKey: replicationKeys.pipelines(projectRef, clusterId),
    queryFn: ({ signal }) => fetchReplicationPipelines({ projectRef, clusterId }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    refetchOnWindowFocus: false,
    retry: checkReplicationFeatureFlagRetry,
    ...options,
  })
}
