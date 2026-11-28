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
  const {
    clusters,
    isDiscovering,
    error: discoveryError,
    refetch,
  } = useReplicationClusters({ enabled: canQuerySources })
  const sources = useQueries({
    queries: clusters.map(({ clusterId, isDefault }) => ({
      ...replicationSourcesQueryOptions({
        projectRef,
        clusterId: isDefault ? undefined : clusterId,
      }),
      enabled: canQuerySources && !isDiscovering && !discoveryError,
      refetchOnMount: 'always' as const,
      staleTime: 0,
    })),
  })
  const sourceIndex = sources.findIndex(
    ({ data, isSuccess, isFetchedAfterMount }) =>
      isSuccess && isFetchedAfterMount && data.sources.some((source) => source.name === projectRef)
  )
  const hasSource = canQuerySources && sourceIndex !== -1
  const cluster = clusters[sourceIndex]
  const clusterId = cluster?.isDefault ? undefined : cluster?.clusterId
  const isPending =
    canQuerySources &&
    !hasSource &&
    !discoveryError &&
    (isDiscovering ||
      sources.some((query) => !query.isFetchedAfterMount || query.isPending || query.isFetching))
  const failedSources = sources.filter(
    ({ error }) => error !== null && !checkLocalPipelinesNotSetUp(error)
  )
  const error =
    canQuerySources && !hasSource && !isPending
      ? (discoveryError ?? failedSources[0]?.error)
      : undefined
  const retry = () =>
    discoveryError ? refetch() : Promise.all(failedSources.map(({ refetch }) => refetch()))

  return { hasSource, clusterId, isPending, error, retry }
}
