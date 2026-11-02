import { useParams } from 'common'

import { useIsPipelinesEnabled } from '@/components/interfaces/Database/Replication/useIsPipelinesEnabled'
import { useReplicationSourcesQuery } from '@/data/replication/sources-query'

/**
 * Whether to surface Pipelines logs (legacy logs sidebar and the unified logs filter). Only
 * projects with Pipelines enabled and at least one replication source produce these logs.
 */
export const useShowPipelinesLogs = () => {
  const { ref: projectRef } = useParams()
  const isPipelinesEnabled = useIsPipelinesEnabled()
  const { data, isLoading } = useReplicationSourcesQuery(
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
    isLoading: isPipelinesEnabled && isLoading,
  }
}
