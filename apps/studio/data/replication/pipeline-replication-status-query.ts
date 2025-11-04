import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { replicationKeys } from './keys'

type ReplicationPipelineReplicationStatusParams = { projectRef?: string; pipelineId?: number }

async function fetchReplicationPipelineReplicationStatus(
  { projectRef, pipelineId }: ReplicationPipelineReplicationStatusParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!pipelineId) throw new Error('pipelineId is required')

  const { data, error } = await get(
    '/platform/replication/{ref}/pipelines/{pipeline_id}/replication-status',
    {
      params: { path: { ref: projectRef, pipeline_id: pipelineId } },
      signal,
    }
  )
  if (error) {
    handleError(error)
  }

  return data
}

export type ReplicationPipelineReplicationStatusData = Awaited<
  ReturnType<typeof fetchReplicationPipelineReplicationStatus>
>

export const useReplicationPipelineReplicationStatusQuery = <
  TData = ReplicationPipelineReplicationStatusData,
>(
  { projectRef, pipelineId }: ReplicationPipelineReplicationStatusParams,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ReplicationPipelineReplicationStatusData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationPipelineReplicationStatusData, ResponseError, TData>({
    queryKey: replicationKeys.pipelinesReplicationStatus(projectRef, pipelineId),
    queryFn: ({ signal }) =>
      fetchReplicationPipelineReplicationStatus({ projectRef, pipelineId }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof pipelineId !== 'undefined',
    ...options,
  })
