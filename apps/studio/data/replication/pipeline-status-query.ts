import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { replicationKeys } from './keys'

type ReplicationPipelinesStatusParams = { projectRef?: string; pipelineId?: number }

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
  }: UseQueryOptions<ReplicationPipelineStatusData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationPipelineStatusData, ResponseError, TData>(
    replicationKeys.pipelinesStatus(projectRef, pipelineId),
    ({ signal }) => fetchReplicationPipelineStatus({ projectRef, pipelineId }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof pipelineId !== 'undefined',
      ...options,
    }
  )
