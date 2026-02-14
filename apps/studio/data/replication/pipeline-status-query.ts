import { useQuery } from '@tanstack/react-query'

import { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { replicationKeys } from './keys'

type ReplicationPipelinesStatusParams = { projectRef?: string; pipelineId?: number }
export type ReplicationPipelineStatusResponse =
  components['schemas']['ReplicationPipelineStatusResponse']
export type ReplicationPipelineStatus = ReplicationPipelineStatusResponse['status']['name']

async function fetchReplicationPipelineStatus(
  { projectRef, pipelineId }: ReplicationPipelinesStatusParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!pipelineId) throw new Error('pipelineId is required')

  const { data, error } = await get('/platform/replication/{ref}/pipelines/{pipeline_id}/status', {
    params: { path: { ref: projectRef, pipeline_id: pipelineId } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

export type ReplicationPipelineStatusData = Awaited<
  ReturnType<typeof fetchReplicationPipelineStatus>
>

export const useReplicationPipelineStatusQuery = <TData = ReplicationPipelineStatusData>(
  { projectRef, pipelineId }: ReplicationPipelinesStatusParams,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ReplicationPipelineStatusData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationPipelineStatusData, ResponseError, TData>({
    queryKey: replicationKeys.pipelinesStatus(projectRef, pipelineId),
    queryFn: ({ signal }) => fetchReplicationPipelineStatus({ projectRef, pipelineId }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof pipelineId !== 'undefined',
    ...options,
  })
