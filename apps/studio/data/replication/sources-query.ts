import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { replicationKeys } from './keys'

type ReplicationSourcesParams = { projectRef?: string }

async function fetchReplicationSources({ projectRef }: ReplicationSourcesParams, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/replication/{ref}/sources', {
    params: { path: { ref: projectRef } },
    signal,
  })
  if (error) {
    if ((error as ResponseError)?.message?.includes('Replication sources not found')) {
      return []
    } else {
      handleError(error)
    }
  }

  return data
}

export type ReplicationSourcesData = Awaited<ReturnType<typeof fetchReplicationSources>>

export const useReplicationSourcesQuery = <TData = ReplicationSourcesData>(
  { projectRef }: ReplicationSourcesParams,
  { enabled = true, ...options }: UseQueryOptions<ReplicationSourcesData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationSourcesData, ResponseError, TData>(
    replicationKeys.sources(projectRef),
    ({ signal }) => fetchReplicationSources({ projectRef }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
