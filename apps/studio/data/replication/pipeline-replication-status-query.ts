import { useQuery } from '@tanstack/react-query'
import { components } from 'api-types'

// TEMPORARY — local design fixture, remove with data/replication/dev-fixtures.ts
import {
  getReplicationStatusFixture,
  isReplicationStatusUnreachable,
  USE_REPLICATION_DEV_FIXTURES,
} from './dev-fixtures'
import { replicationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type ReplicationPipelineReplicationStatusParams = { projectRef?: string; pipelineId?: number }

export type ReplicationPipelineTableStatus =
  components['schemas']['ReplicationPipelineReplicationStatusResponse']['table_statuses'][number]

async function fetchReplicationPipelineReplicationStatus(
  { projectRef, pipelineId }: ReplicationPipelineReplicationStatusParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!pipelineId) throw new Error('pipelineId is required')

  if (USE_REPLICATION_DEV_FIXTURES) {
    if (isReplicationStatusUnreachable()) throw new Error('Fixture: replication status unreachable')
    return getReplicationStatusFixture(pipelineId)
  }

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
    // TEMPORARY, part of the dev fixture: a thrown fixture error would otherwise retry with
    // backoff for several seconds and look like the no-tables state meanwhile
    ...(USE_REPLICATION_DEV_FIXTURES ? { retry: false } : {}),
    ...options,
  })
