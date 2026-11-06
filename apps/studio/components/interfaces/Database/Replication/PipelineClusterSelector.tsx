import { useQuery } from '@tanstack/react-query'
import { parseAsString, useQueryState } from 'nuqs'
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'ui'

import { AlertError } from '@/components/ui/AlertError'
import { replicationClustersQueryOptions } from '@/data/replication/clusters-query'
import { IS_PLATFORM } from '@/lib/constants'

export const PipelineClusterSelector = () => {
  const [requestedClusterId, setClusterId] = useQueryState('cluster_id', parseAsString)
  const { data, isError, error } = useQuery(replicationClustersQueryOptions())

  const clusterId = requestedClusterId ?? data?.default_cluster_id

  if (!IS_PLATFORM) return null
  if (isError) return <AlertError error={error} subject="Failed to load pipeline clusters" />
  if (!data || data.regions.length <= 1) return null

  return (
    <div className="flex items-center gap-3">
      <Label htmlFor="pipeline-cluster">Cluster</Label>
      <Select value={clusterId} onValueChange={(value) => void setClusterId(value)}>
        <SelectTrigger id="pipeline-cluster" className="w-64" aria-label="Pipeline cluster">
          <SelectValue placeholder="Loading clusters..." />
        </SelectTrigger>
        <SelectContent>
          {data.regions.map((cluster) => (
            <SelectItem key={cluster.cluster_id} value={cluster.cluster_id}>
              {cluster.name}
              {cluster.aws_region ? ` (${cluster.aws_region})` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
