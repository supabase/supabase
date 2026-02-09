import { useQuery } from '@tanstack/react-query'
import type { components } from 'api-types'
import { get, handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'

import { replicationKeys } from './keys'

type ReplicationDestinationByIdParams = { projectRef?: string; destinationId?: number | null }

async function fetchReplicationDestinationById(
  { projectRef, destinationId }: ReplicationDestinationByIdParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!destinationId) throw new Error('destinationId is required')
  const { data, error } = await get('/platform/replication/{ref}/destinations/{destination_id}', {
    params: { path: { ref: projectRef, destination_id: destinationId } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

export type ReplicationDestinationByIdData = components['schemas']['ReplicationDestinationResponse']

export const useReplicationDestinationByIdQuery = <TData = ReplicationDestinationByIdData>(
  { projectRef, destinationId }: ReplicationDestinationByIdParams,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ReplicationDestinationByIdData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationDestinationByIdData, ResponseError, TData>({
    queryKey: replicationKeys.destinationById(projectRef, destinationId),
    queryFn: ({ signal }) => fetchReplicationDestinationById({ projectRef, destinationId }, signal),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      typeof destinationId !== 'undefined' &&
      destinationId !== null,
    ...options,
  })
