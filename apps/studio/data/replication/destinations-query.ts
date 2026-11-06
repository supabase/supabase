import { useQuery } from '@tanstack/react-query'

import { replicationKeys } from './keys'
import { checkReplicationFeatureFlagRetry } from './utils'
import { get, handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import { useReplicationClusterId } from '@/state/replication-cluster'
import type { UseCustomQueryOptions } from '@/types'

type ReplicationDestinationsParams = { projectRef?: string; clusterId?: string }

async function fetchReplicationDestinations(
  { projectRef, clusterId }: ReplicationDestinationsParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/replication/{ref}/destinations', {
    params: { path: { ref: projectRef }, query: { cluster_id: clusterId } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

export type ReplicationDestinationsData = Awaited<ReturnType<typeof fetchReplicationDestinations>>

export const useReplicationDestinationsQuery = <TData = ReplicationDestinationsData>(
  { projectRef, clusterId: requestedClusterId }: ReplicationDestinationsParams,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ReplicationDestinationsData, StudioError, TData> = {}
) => {
  const clusterId = useReplicationClusterId(requestedClusterId)
  return useQuery<ReplicationDestinationsData, StudioError, TData>({
    queryKey: replicationKeys.destinations(projectRef, clusterId),
    queryFn: ({ signal }) => fetchReplicationDestinations({ projectRef, clusterId }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    refetchOnWindowFocus: false,
    retry: checkReplicationFeatureFlagRetry,
    ...options,
  })
}
