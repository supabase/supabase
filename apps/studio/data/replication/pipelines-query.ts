import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { replicationKeys } from './keys'
import { checkReplicationFeatureFlagRetry } from './utils'

type ReplicationPipelinesParams = { projectRef?: string }

async function fetchReplicationPipelines(
  { projectRef }: ReplicationPipelinesParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/replication/{ref}/pipelines', {
    params: { path: { ref: projectRef } },
    signal,
  })

  if (error) handleError(error)
  return data
}

export type ReplicationPipelinesData = Awaited<ReturnType<typeof fetchReplicationPipelines>>
export type Pipeline = ReplicationPipelinesData['pipelines'][0]

export const useReplicationPipelinesQuery = <TData = ReplicationPipelinesData>(
  { projectRef }: ReplicationPipelinesParams,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ReplicationPipelinesData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationPipelinesData, ResponseError, TData>({
    queryKey: replicationKeys.pipelines(projectRef),
    queryFn: ({ signal }) => fetchReplicationPipelines({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: checkReplicationFeatureFlagRetry,
    ...options,
  })
