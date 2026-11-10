import { queryOptions, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

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

export type ReplicationRegion = ReplicationClustersData['regions'][number]

export const replicationClustersQueryOptions = () =>
  queryOptions<ReplicationClustersData, ReplicationClustersError>({
    queryKey: replicationKeys.clusters(),
    queryFn: ({ signal }) => getReplicationClusters(signal),
    enabled: IS_PLATFORM,
    staleTime: 5 * 60 * 1000,
    // A failed discovery falls back to the default cluster. Retrying whenever another region
    // consumer mounts would put the pipeline pages back into their loading state in a loop.
    retryOnMount: false,
  })

// The default cluster maps to undefined so its requests omit cluster_id and share cache keys with
// replication callers that never pass a cluster.
export const toRequestClusterId = (
  clusterId: string | null | undefined,
  defaultClusterId: string | undefined
) => (clusterId === null || clusterId === defaultClusterId ? undefined : clusterId)

/**
 * The cluster a new pipeline starts in: the one in the project's database region, otherwise the
 * environment default. Returned as a request cluster ID, so the default maps to `undefined`.
 */
export const getPreferredClusterId = (
  data: ReplicationClustersData | undefined,
  projectRegion: string | undefined
) => {
  const match = projectRegion
    ? data?.regions.find((region) => region.region_code === projectRegion)
    : undefined
  return toRequestClusterId(match?.cluster_id ?? data?.default_cluster_id, data?.default_cluster_id)
}

export type ReplicationClusterGroup = {
  clusterId: string | undefined
  region?: ReplicationRegion
}

/** Every cluster to query, default first. Only the default cluster when regions are unavailable. */
export const useReplicationClusterGroups = () => {
  const { data } = useQuery(replicationClustersQueryOptions())
  const groups = useMemo<ReplicationClusterGroup[]>(() => {
    const regions = data?.regions ?? []
    if (regions.length === 0) return [{ clusterId: undefined }]
    const isDefault = (region: ReplicationRegion) => region.cluster_id === data?.default_cluster_id
    return [...regions.filter(isDefault), ...regions.filter((region) => !isDefault(region))].map(
      (region) => ({
        clusterId: toRequestClusterId(region.cluster_id, data?.default_cluster_id),
        region,
      })
    )
  }, [data])

  return { groups, hasMultipleRegions: groups.length > 1 }
}

export const getReplicationRegionLabel = (region: ReplicationRegion | undefined) => {
  if (!region) return undefined
  return region.region_code ? `${region.region_name} (${region.region_code})` : region.region_name
}
