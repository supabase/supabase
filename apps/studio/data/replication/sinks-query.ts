import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { replicationKeys } from './keys'

type ReplicationSinksParams = { projectRef?: string }

async function fetchReplicationSinks({ projectRef }: ReplicationSinksParams, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/replication/{ref}/sinks', {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

export type ReplicationSinksData = Awaited<ReturnType<typeof fetchReplicationSinks>>

export const useReplicationSinksQuery = <TData = ReplicationSinksData>(
  { projectRef }: ReplicationSinksParams,
  { enabled = true, ...options }: UseQueryOptions<ReplicationSinksData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationSinksData, ResponseError, TData>(
    replicationKeys.sinks(projectRef),
    ({ signal }) => fetchReplicationSinks({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
