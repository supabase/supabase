import { useQuery } from '@tanstack/react-query'

import { replicationClustersQueryOptions } from '@/data/replication/clusters-query'

export type ReplicationCluster = {
  clusterId: string | undefined
  regionName: string | undefined
  regionCode: string | null
  isDefault: boolean
}

/** Clusters that pipelines belong to, with the default first. */
export const useReplicationClusters = ({ enabled = true } = {}) => {
  const options = replicationClustersQueryOptions()
  const { data, isPending, error, refetch } = useQuery({
    ...options,
    enabled: enabled && options.enabled,
  })
  const clusters: ReplicationCluster[] = (data?.regions ?? []).map((region) => ({
    clusterId: region.cluster_id,
    regionName: region.region_name,
    regionCode: region.region_code,
    isDefault: region.cluster_id === data?.default_cluster_id,
  }))
  clusters.sort((a, b) => Number(b.isDefault) - Number(a.isDefault))
  if (clusters.length === 0) {
    clusters.push({
      clusterId: undefined,
      regionName: undefined,
      regionCode: null,
      isDefault: true,
    })
  }
  return {
    clusters,
    error,
    refetch,
    hasMultipleRegions: clusters.length > 1,
    isDiscovering: enabled && options.enabled && isPending,
  }
}
