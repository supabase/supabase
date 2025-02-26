import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { replicationKeys } from './keys'

type ReplicationSinkByIdParams = { projectRef?: string; sinkId?: number }

async function fetchReplicationSinkById(
  { projectRef, sinkId }: ReplicationSinkByIdParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!sinkId) throw new Error('sinkId is required')
  const { data, error } = await get('/platform/replication/{ref}/sinks/{sink_id}', {
    params: { path: { ref: projectRef, sink_id: sinkId } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

export type ReplicationSinkByIdData = Awaited<ReturnType<typeof fetchReplicationSinkById>>

export const useReplicationSinkByIdQuery = <TData = ReplicationSinkByIdData>(
  { projectRef, sinkId }: ReplicationSinkByIdParams,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ReplicationSinkByIdData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationSinkByIdData, ResponseError, TData>(
    replicationKeys.sinkById(projectRef, sinkId),
    ({ signal }) => fetchReplicationSinkById({ projectRef, sinkId }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof sinkId !== 'undefined',
      ...options,
    }
  )
