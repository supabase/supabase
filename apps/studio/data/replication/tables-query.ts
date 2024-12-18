import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { replicationKeys } from './keys'

type ReplicationTablesParams = { projectRef?: string; sourceId: number }

async function fetchReplicationTables(
  { projectRef, sourceId }: ReplicationTablesParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { data, error } = await get('/platform/replication/{ref}/sources/{source_id}/tables', {
    params: { path: { ref: projectRef, source_id: sourceId } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data
}

export type ReplicationTablesData = Awaited<ReturnType<typeof fetchReplicationTables>>

export const useReplicationTablesQuery = <TData = ReplicationTablesData>(
  { projectRef, sourceId }: ReplicationTablesParams,
  { enabled = true, ...options }: UseQueryOptions<ReplicationTablesData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationTablesData, ResponseError, TData>(
    replicationKeys.tables(projectRef, sourceId),
    ({ signal }) => fetchReplicationTables({ projectRef, sourceId }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
