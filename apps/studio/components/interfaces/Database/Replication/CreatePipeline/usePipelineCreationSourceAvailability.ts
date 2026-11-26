import { useQueries } from '@tanstack/react-query'

import { useReplicationClusters } from '@/components/interfaces/Database/Replication/useReplicationClusters'
import { replicationSourcesQueryOptions } from '@/data/replication/sources-query'
import { checkLocalPipelinesNotSetUp } from '@/data/replication/utils'

export const usePipelineCreationSourceAvailability = ({
  projectRef,
  enabled,
}: {
  projectRef: string | undefined
  enabled: boolean
}) => {
  const canQuerySources = !!projectRef && enabled
  const { clusters, isDiscovering } = useReplicationClusters({ enabled: canQuerySources })
  const sources = useQueries({
    queries: clusters.map(({ clusterId, isDefault }) => ({
      ...replicationSourcesQueryOptions({
        projectRef,
        clusterId: isDefault ? undefined : clusterId,
      }),
      enabled: canQuerySources && !isDiscovering,
      refetchOnMount: 'always' as const,
      staleTime: 0,
    })),
  })
  const hasSource =
    canQuerySources &&
    sources.some(
      ({ data, isSuccess, isFetchedAfterMount }) =>
        isSuccess &&
        isFetchedAfterMount &&
        data.sources.some((source) => source.name === projectRef)
    )
  const isPending =
    canQuerySources &&
    !hasSource &&
    (isDiscovering ||
      sources.some((query) => !query.isFetchedAfterMount || query.isPending || query.isFetching))
  const failedSources = sources.filter(
    ({ error }) => error !== null && !checkLocalPipelinesNotSetUp(error)
  )
  const error = canQuerySources && !hasSource && !isPending ? failedSources[0]?.error : undefined
  const retry = () => Promise.all(failedSources.map(({ refetch }) => refetch()))

  return { hasSource, isPending, error, retry }
}
