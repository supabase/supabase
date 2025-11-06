import { useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { replicationKeys } from './keys'

type ReplicationSourcesParams = { projectRef?: string }

async function fetchReplicationSources(
  { projectRef }: ReplicationSourcesParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/replication/{ref}/sources', {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

export type ReplicationSourcesData = Awaited<ReturnType<typeof fetchReplicationSources>>

export const useReplicationSourcesQuery = <TData = ReplicationSourcesData>(
  { projectRef }: ReplicationSourcesParams,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ReplicationSourcesData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationSourcesData, ResponseError, TData>({
    queryKey: replicationKeys.sources(projectRef),
    queryFn: ({ signal }) => fetchReplicationSources({ projectRef }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      if (
        typeof error === 'object' &&
        error !== null &&
        error.code === 503 &&
        error.message.includes('feature flag is required')
      ) {
        return false
      }

      if (failureCount < 3) {
        return true
      }

      return false
    },
    ...options,
  })
