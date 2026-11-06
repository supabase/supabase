import { queryOptions } from '@tanstack/react-query'

import { replicationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { IS_PLATFORM } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'

async function getReplicationClusters(signal?: AbortSignal) {
  const { data, error } = await get('/platform/replication/regions', { signal })
  if (error) handleError(error)
  return data
}

export type ReplicationClustersData = Awaited<ReturnType<typeof getReplicationClusters>>

export type ReplicationClustersError = StudioError

export const replicationClustersQueryOptions = () =>
  queryOptions<ReplicationClustersData, ReplicationClustersError>({
    queryKey: replicationKeys.clusters(),
    queryFn: ({ signal }) => getReplicationClusters(signal),
    enabled: IS_PLATFORM,
    staleTime: 5 * 60 * 1000,
  })
