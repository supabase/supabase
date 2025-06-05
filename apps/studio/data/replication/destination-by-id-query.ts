import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { replicationKeys } from './keys'

type ReplicationDestinationByIdParams = { projectRef?: string; destinationId?: number }

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

export type ReplicationDestinationByIdData = Awaited<
  ReturnType<typeof fetchReplicationDestinationById>
>

export const useReplicationDestinationByIdQuery = <TData = ReplicationDestinationByIdData>(
  { projectRef, destinationId }: ReplicationDestinationByIdParams,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ReplicationDestinationByIdData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationDestinationByIdData, ResponseError, TData>(
    replicationKeys.destinationById(projectRef, destinationId),
    ({ signal }) => fetchReplicationDestinationById({ projectRef, destinationId }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof destinationId !== 'undefined',
      ...options,
    }
  )
