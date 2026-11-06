import { useQuery } from '@tanstack/react-query'

import { replicationKeys } from './keys'
import { pipelineIdSchema } from './pipeline-id'
import { get, handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import { useReplicationClusterId } from '@/state/replication-cluster'
import type { UseCustomQueryOptions } from '@/types'

type ReplicationPipelineByIdParams = {
  projectRef?: string
  pipelineId?: string
  clusterId?: string
}

async function fetchReplicationPipelineById(
  { projectRef, pipelineId, clusterId }: ReplicationPipelineByIdParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!pipelineId) throw new Error('pipelineId is required')
  const { data, error } = await get('/platform/replication/{ref}/pipelines/{pipeline_id}', {
    params: {
      path: { ref: projectRef, pipeline_id: pipelineId },
      query: { cluster_id: clusterId },
    },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return { ...data, id: pipelineIdSchema.parse(data.id) }
}

export type ReplicationPipelineByIdData = Awaited<ReturnType<typeof fetchReplicationPipelineById>>

export const useReplicationPipelineByIdQuery = <TData = ReplicationPipelineByIdData>(
  { projectRef, pipelineId, clusterId: requestedClusterId }: ReplicationPipelineByIdParams,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ReplicationPipelineByIdData, StudioError, TData> = {}
) => {
  const clusterId = useReplicationClusterId(requestedClusterId)
  return useQuery<ReplicationPipelineByIdData, StudioError, TData>({
    queryKey: replicationKeys.pipelineById(projectRef, pipelineId, clusterId),
    queryFn: ({ signal }) =>
      fetchReplicationPipelineById({ projectRef, pipelineId, clusterId }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof pipelineId !== 'undefined',
    ...options,
  })
}
