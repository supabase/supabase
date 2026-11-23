import { useFeatureFlags, useParams } from 'common'

import { useIsPipelinesEnabled } from '@/components/interfaces/Database/Replication/useIsPipelinesEnabled'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
import { useReplicationSourcesQuery } from '@/data/replication/sources-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

/**
 * Whether to surface Pipelines logs (legacy logs sidebar and the unified logs filter). Only
 * projects with Pipelines enabled and at least one replication source produce these logs.
 */
export const useShowPipelinesLogs = () => {
  const { ref: projectRef } = useParams()
  const { hasLoaded: hasLoadedFlags, isConfigCatStale } = useFeatureFlags()
  const { isLoading: isLoadingProject } = useProjectDetailQuery({ ref: projectRef })
  const { isLoading: isLoadingOrganization } = useSelectedOrganizationQuery()

  const isPipelinesEnabled = useIsPipelinesEnabled()
  const isLoadingAccess =
    !hasLoadedFlags || !!isConfigCatStale || isLoadingProject || isLoadingOrganization

  const { data, isLoading: isLoadingSources } = useReplicationSourcesQuery(
    { projectRef },
    {
      enabled: isPipelinesEnabled,
      retry: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }
  )

  return {
    showPipelinesLogs: isPipelinesEnabled && (data?.sources?.length ?? 0) > 0,
    isLoading: isLoadingAccess || (isPipelinesEnabled && isLoadingSources),
  }
}
