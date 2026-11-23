import { useQuery } from '@tanstack/react-query'

import { replicationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomQueryOptions } from '@/types'

type ReplicationDestinationByIdParams = {
  projectRef?: string
  destinationId?: number | null
  clusterId?: string
}

async function fetchReplicationDestinationById(
  { projectRef, destinationId, clusterId }: ReplicationDestinationByIdParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!destinationId) throw new Error('destinationId is required')
  const { data, error } = await get('/platform/replication/{ref}/destinations/{destination_id}', {
    params: {
      path: { ref: projectRef, destination_id: destinationId },
      query: { cluster_id: clusterId },
    },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

export type ReplicationDestinationByIdData = Awaited<
  ReturnType<typeof fetchReplicationDestinationById>
>

export const useReplicationDestinationByIdQuery = <TData = ReplicationDestinationByIdData>(
  variables: ReplicationDestinationByIdParams,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ReplicationDestinationByIdData, StudioError, TData> = {}
) => {
  const { projectRef, destinationId, clusterId } = variables
  return useQuery<ReplicationDestinationByIdData, StudioError, TData>({
    queryKey: replicationKeys.destinationById(projectRef, destinationId, clusterId),
    queryFn: ({ signal }) =>
      fetchReplicationDestinationById({ projectRef, destinationId, clusterId }, signal),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      typeof destinationId !== 'undefined' &&
      destinationId !== null,
    ...options,
  })
}
