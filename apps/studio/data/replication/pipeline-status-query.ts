import { queryOptions, useQuery } from '@tanstack/react-query'
import { components } from 'api-types'

import { replicationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

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

/**
 * Shared definition so callers that need many pipeline statuses at once (`useQueries`) hit the
 * same cache entries as the per-pipeline hook below, rather than fetching each status twice.
 */
export const replicationPipelineStatusQueryOptions = ({
  projectRef,
  pipelineId,
}: ReplicationPipelinesStatusParams) =>
  queryOptions<ReplicationPipelineStatusData, ResponseError>({
    queryKey: replicationKeys.pipelinesStatus(projectRef, pipelineId),
    queryFn: ({ signal }) => fetchReplicationPipelineStatus({ projectRef, pipelineId }, signal),
    enabled: typeof projectRef !== 'undefined' && typeof pipelineId !== 'undefined',
  })

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
