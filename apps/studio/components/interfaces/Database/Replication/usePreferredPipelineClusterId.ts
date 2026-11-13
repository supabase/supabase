import { useQuery } from '@tanstack/react-query'

import {
  getPreferredClusterId,
  replicationClustersQueryOptions,
} from '@/data/replication/clusters-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

/**
 * The cluster a new pipeline should start in, once regions (and, with several regions, the
 * project) have loaded. A single region is always the default, so the project is not needed.
 */
export const usePreferredPipelineClusterId = () => {
  const { data: clusters, isSuccess: hasClusters } = useQuery(replicationClustersQueryOptions())
  const hasMultipleRegions = (clusters?.regions.length ?? 0) > 1
  const { data: project, isSuccess: hasProject } = useSelectedProjectQuery({
    enabled: hasMultipleRegions,
  })

  return {
    clusterId: getPreferredClusterId(clusters, hasMultipleRegions ? project?.region : undefined),
    isReady: hasClusters && (!hasMultipleRegions || hasProject),
  }
}
