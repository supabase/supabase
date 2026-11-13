import { queryOptions, useQuery } from '@tanstack/react-query'

import { replicationKeys } from './keys'
import { checkReplicationFeatureFlagRetry } from './utils'
import { get, handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import { useReplicationClusterId } from '@/state/replication-cluster'
import type { UseCustomQueryOptions } from '@/types'

type ReplicationSourcesParams = { projectRef?: string; clusterId?: string }

async function fetchReplicationSources(
  { projectRef, clusterId }: ReplicationSourcesParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/replication/{ref}/sources', {
    params: { path: { ref: projectRef }, query: { cluster_id: clusterId } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

export type ReplicationSourcesData = Awaited<ReturnType<typeof fetchReplicationSources>>

export const replicationSourcesQueryOptions = <TData = ReplicationSourcesData>({
  projectRef,
  clusterId,
}: ReplicationSourcesParams) =>
  queryOptions<ReplicationSourcesData, StudioError, TData>({
    queryKey: replicationKeys.sources(projectRef, clusterId),
    queryFn: ({ signal }) => fetchReplicationSources({ projectRef, clusterId }, signal),
    enabled: typeof projectRef !== 'undefined',
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    retry: checkReplicationFeatureFlagRetry,
  })

export const useReplicationSourcesQuery = <TData = ReplicationSourcesData>(
  { projectRef, clusterId: requestedClusterId }: ReplicationSourcesParams,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ReplicationSourcesData, StudioError, TData> = {}
) => {
  const clusterId = useReplicationClusterId(requestedClusterId)
  return useQuery<ReplicationSourcesData, StudioError, TData>({
    ...replicationSourcesQueryOptions<TData>({ projectRef, clusterId }),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
}

export const useReplicationSourceId = ({
  projectRef,
  clusterId,
}: {
  projectRef?: string
  clusterId?: string
}) => {
  const { data: sourcesData } = useReplicationSourcesQuery({ projectRef, clusterId })
  return sourcesData?.sources.find((s) => s.name === projectRef)?.id
}
