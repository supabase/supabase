export const withReplicationCluster = (path: string, clusterId?: string) =>
  clusterId === undefined ? path : `${path}?cluster_id=${encodeURIComponent(clusterId)}`
