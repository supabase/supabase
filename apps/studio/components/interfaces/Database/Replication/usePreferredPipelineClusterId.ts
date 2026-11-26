import { useQuery } from '@tanstack/react-query'

import { getPreferredClusterId } from '@/components/interfaces/Database/Replication/PipelineClusterScope.utils'
import { replicationClustersQueryOptions } from '@/data/replication/clusters-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'

/**
 * The cluster a new pipeline should start in, once regions (and, with several regions, the
 * project) have loaded. A single region is always the default, so the project is not needed.
 */
export const usePreferredPipelineClusterId = ({ enabled = true } = {}) => {
  const options = replicationClustersQueryOptions()
  const { data: clusters, isPending: isDiscovering } = useQuery({
    ...options,
    enabled: enabled && options.enabled,
  })
  const shouldLoadProject = enabled && (clusters?.regions.length ?? 0) > 1
  const {
    data: project,
    isPending: isProjectPending,
    isFetched: hasFetchedProject,
  } = useSelectedProjectQuery({ enabled: shouldLoadProject })
  // Project observers in the form can refetch a failed lookup when they mount.
  const isWaitingForProject = shouldLoadProject && isProjectPending && !hasFetchedProject

  return {
    clusters,
    clusterId: getPreferredClusterId(clusters, shouldLoadProject ? project?.region : undefined),
    isReady: !enabled || ((!IS_PLATFORM || !isDiscovering) && !isWaitingForProject),
  }
}
