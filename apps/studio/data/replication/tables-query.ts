import { queryOptions, useQuery } from '@tanstack/react-query'

import { replicationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type ReplicationTablesParams = { projectRef?: string; sourceId?: number }

async function fetchReplicationTables(
  { projectRef, sourceId }: ReplicationTablesParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!sourceId) throw new Error('sourceId is required')

  const { data, error } = await get('/platform/replication/v2/{ref}/sources/{source_id}/tables', {
    params: { path: { ref: projectRef, source_id: sourceId } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data.tables
}

export type ReplicationTablesData = Awaited<ReturnType<typeof fetchReplicationTables>>

type ReplicationTablesQueryOptions<TData> = Omit<
  UseCustomQueryOptions<ReplicationTablesData, ResponseError, TData>,
  'enabled'
> & { enabled?: boolean }

export const replicationTablesQueryOptions = <TData = ReplicationTablesData>(
  { projectRef, sourceId }: ReplicationTablesParams,
  { enabled = true, ...options }: ReplicationTablesQueryOptions<TData> = {}
) =>
  queryOptions<ReplicationTablesData, ResponseError, TData>({
    queryKey: replicationKeys.tables(projectRef, sourceId),
    queryFn: ({ signal }) => fetchReplicationTables({ projectRef, sourceId }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof sourceId !== 'undefined',
    ...options,
  })

export const useReplicationTablesQuery = <TData = ReplicationTablesData>(
  { projectRef, sourceId }: ReplicationTablesParams,
  options: ReplicationTablesQueryOptions<TData> = {}
) => useQuery(replicationTablesQueryOptions({ projectRef, sourceId }, options))
