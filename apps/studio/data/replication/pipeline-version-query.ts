import { useQuery } from '@tanstack/react-query'

import { replicationKeys } from './keys'
import { pipelineIdSchema } from './pipeline-id'
import { get, handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import { useReplicationClusterId } from '@/state/replication-cluster'
import type { UseCustomQueryOptions } from '@/types'

type ReplicationPipelineVersionParams = {
  projectRef?: string
  pipelineId?: string
  clusterId?: string
}
type ReplicationPipelineVersionResponse = Awaited<
  ReturnType<typeof fetchReplicationPipelineVersion>
>

export async function fetchReplicationPipelineVersion(
  { projectRef, pipelineId, clusterId }: ReplicationPipelineVersionParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!pipelineId) throw new Error('pipelineId is required')

  const { data, error } = await get('/platform/replication/{ref}/pipelines/{pipeline_id}/version', {
    params: {
      path: { ref: projectRef, pipeline_id: pipelineId },
      query: { cluster_id: clusterId },
    },
    signal,
  })

  if (error) handleError(error)
  return { ...data, pipeline_id: pipelineIdSchema.parse(data.pipeline_id) }
}

type ReplicationPipelineVersionData = ReplicationPipelineVersionResponse

export const useReplicationPipelineVersionQuery = <TData = ReplicationPipelineVersionData>(
  { projectRef, pipelineId, clusterId: requestedClusterId }: ReplicationPipelineVersionParams,
  {
    enabled = true,
    staleTime = Infinity,
    refetchOnMount = false,
    refetchOnWindowFocus = false,
    ...options
  }: UseCustomQueryOptions<ReplicationPipelineVersionData, StudioError, TData> = {}
) => {
  const clusterId = useReplicationClusterId(requestedClusterId)
  return useQuery<ReplicationPipelineVersionData, StudioError, TData>({
    queryKey: replicationKeys.pipelinesVersion(projectRef, pipelineId, clusterId),
    queryFn: ({ signal }) =>
      fetchReplicationPipelineVersion({ projectRef, pipelineId, clusterId }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof pipelineId !== 'undefined',
    staleTime,
    refetchOnMount,
    refetchOnWindowFocus,
    ...options,
  })
}
