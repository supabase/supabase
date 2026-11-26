import { queryOptions } from '@tanstack/react-query'

import { replicationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'

async function getReplicationClusters(signal?: AbortSignal) {
  const { data, error } = await get('/platform/replication/regions', {
    signal,
  })
  if (error) handleError(error)
  return data
}

export type ReplicationClustersData = Awaited<ReturnType<typeof getReplicationClusters>>

export type ReplicationClustersError = StudioError

export type ReplicationRegion = ReplicationClustersData['regions'][number]

export const replicationClustersQueryOptions = () =>
  queryOptions<ReplicationClustersData, ReplicationClustersError>({
    queryKey: replicationKeys.clusters(),
    queryFn: ({ signal }) => getReplicationClusters(signal),
    // Vite compile-time constants; the temporary local mock config defines this flag.
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    enabled: IS_PLATFORM || (import.meta.env.DEV && import.meta.env.STUDIO_PIPELINES_MOCK === true),
    staleTime: 5 * 60 * 1000,
    // A failed discovery falls back to the default cluster. Retrying whenever another region
    // consumer mounts would put the pipeline pages back into their loading state in a loop.
    retryOnMount: false,
  })
