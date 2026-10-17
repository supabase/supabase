import { QueryObserver, queryOptions, useQuery, type QueryClient } from '@tanstack/react-query'
import { components } from 'api-types'

import { replicationKeys } from './keys'
import { replicationPollingOptions } from './polling'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type ReplicationPipelinesStatusParams = { projectRef?: string; pipelineId?: number }

const PIPELINE_STOP_TIMEOUT_MS = 30_000
export type ReplicationPipelineStatusResponse =
  components['schemas']['PipelineStatusResponse_Output']
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
export const replicationPipelineStatusQueryOptions = <TData = ReplicationPipelineStatusData>({
  projectRef,
  pipelineId,
}: ReplicationPipelinesStatusParams) =>
  queryOptions<ReplicationPipelineStatusData, ResponseError, TData>({
    queryKey: replicationKeys.pipelinesStatus(projectRef, pipelineId),
    queryFn: ({ signal }) => fetchReplicationPipelineStatus({ projectRef, pipelineId }, signal),
    ...replicationPollingOptions,
    enabled: typeof projectRef !== 'undefined' && typeof pipelineId !== 'undefined',
  })

/** Shares the dashboard's status request while waiting for shutdown before deletion. */
export function waitForPipelineStopped(
  queryClient: QueryClient,
  variables: ReplicationPipelinesStatusParams
): Promise<void> {
  return new Promise((resolve, reject) => {
    const observer = new QueryObserver(queryClient, {
      ...replicationPipelineStatusQueryOptions(variables),
      staleTime: 0,
      refetchIntervalInBackground: true,
    })
    const timer = setTimeout(() => {
      observer.destroy()
      reject(
        new Error('Pipeline is still stopping. Wait for it to stop, then try deleting it again.')
      )
    }, PIPELINE_STOP_TIMEOUT_MS)
    observer.subscribe((result) => {
      if (result.fetchStatus !== 'idle') return
      if (result.isError || result.data?.status.name === 'stopped') {
        clearTimeout(timer)
        observer.destroy()
        if (result.isError) reject(result.error)
        else resolve()
      }
    })
  })
}

export const useReplicationPipelineStatusQuery = <TData = ReplicationPipelineStatusData>(
  variables: ReplicationPipelinesStatusParams,
  options: UseCustomQueryOptions<ReplicationPipelineStatusData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationPipelineStatusData, ResponseError, TData>({
    ...replicationPipelineStatusQueryOptions<TData>(variables),
    ...options,
    enabled:
      options.enabled !== false &&
      typeof variables.projectRef !== 'undefined' &&
      typeof variables.pipelineId !== 'undefined',
  })
