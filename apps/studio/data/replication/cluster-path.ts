export const withReplicationCluster = (path: string, clusterId?: string) => {
  if (clusterId === undefined) return path
  const [pathname, search] = path.split('?')
  const params = new URLSearchParams(search)
  params.set('cluster_id', clusterId)
  return `${pathname}?${params.toString()}`
}
