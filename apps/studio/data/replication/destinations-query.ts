import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { replicationKeys } from './keys'

type ReplicationDestinationsParams = { projectRef?: string }

async function fetchReplicationDestinations(
  { projectRef }: ReplicationDestinationsParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/replication/{ref}/destinations', {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

export type ReplicationDestinationsData = Awaited<ReturnType<typeof fetchReplicationDestinations>>

export const useReplicationDestinationsQuery = <TData = ReplicationDestinationsData>(
  { projectRef }: ReplicationDestinationsParams,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ReplicationDestinationsData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationDestinationsData, ResponseError, TData>(
    replicationKeys.destinations(projectRef),
    ({ signal }) => fetchReplicationDestinations({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
