import { queryOptions, useQuery } from '@tanstack/react-query'
import { components } from 'api-types'

import { replicationKeys } from './keys'
import { replicationPollingOptions } from './polling'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type ReplicationPipelineReplicationStatusVariables = {
  projectRef?: string
  pipelineId?: number
}

export type ReplicationPipelineReplicationStatusError = ResponseError

export type ReplicationPipelineTableStatus =
  components['schemas']['PipelineReplicationStatusResponse_Output']['table_statuses'][number]

async function fetchReplicationPipelineReplicationStatus(
  { projectRef, pipelineId }: ReplicationPipelineReplicationStatusVariables,
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

export const replicationPipelineReplicationStatusQueryOptions = <
  TData = ReplicationPipelineReplicationStatusData,
>({
  projectRef,
  pipelineId,
}: ReplicationPipelineReplicationStatusVariables) =>
  queryOptions<
    ReplicationPipelineReplicationStatusData,
    ReplicationPipelineReplicationStatusError,
    TData
  >({
    queryKey: replicationKeys.pipelinesReplicationStatus(projectRef, pipelineId),
    queryFn: ({ signal }) =>
      fetchReplicationPipelineReplicationStatus({ projectRef, pipelineId }, signal),
    ...replicationPollingOptions,
    enabled: typeof projectRef !== 'undefined' && typeof pipelineId !== 'undefined',
  })

export const useReplicationPipelineReplicationStatusQuery = <
  TData = ReplicationPipelineReplicationStatusData,
>(
  variables: ReplicationPipelineReplicationStatusVariables,
  options: UseCustomQueryOptions<
    ReplicationPipelineReplicationStatusData,
    ReplicationPipelineReplicationStatusError,
    TData
  > = {}
) =>
  useQuery<
    ReplicationPipelineReplicationStatusData,
    ReplicationPipelineReplicationStatusError,
    TData
  >({
    ...replicationPipelineReplicationStatusQueryOptions<TData>(variables),
    ...options,
    enabled:
      options.enabled !== false &&
      typeof variables.projectRef !== 'undefined' &&
      typeof variables.pipelineId !== 'undefined',
  })
