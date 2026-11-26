import type { ReplicationClustersData } from '@/data/replication/clusters-query'

// Default-cluster requests retain the API's omission semantics.
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
