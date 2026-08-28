import { queryOptions, useQuery } from '@tanstack/react-query'

import { replicationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type ReplicationTableColumnsParams = { projectRef?: string; sourceId?: number; tableId?: number }

async function fetchReplicationTableColumns(
  { projectRef, sourceId, tableId }: ReplicationTableColumnsParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!sourceId) throw new Error('sourceId is required')
  if (tableId === undefined) throw new Error('tableId is required')

  const { data, error } = await get(
    '/platform/replication/v2/{ref}/sources/{source_id}/tables/{table_id}/columns',
    {
      params: { path: { ref: projectRef, source_id: sourceId, table_id: tableId } },
      signal,
    }
  )
  if (error) {
    handleError(error)
  }

  return data.columns
}

export type ReplicationTableColumnsData = Awaited<ReturnType<typeof fetchReplicationTableColumns>>

type ReplicationTableColumnsQueryOptions<TData> = Omit<
  UseCustomQueryOptions<ReplicationTableColumnsData, ResponseError, TData>,
  'enabled'
> & { enabled?: boolean }

export const replicationTableColumnsQueryOptions = <TData = ReplicationTableColumnsData>(
  { projectRef, sourceId, tableId }: ReplicationTableColumnsParams,
  { enabled = true, ...options }: ReplicationTableColumnsQueryOptions<TData> = {}
) =>
  queryOptions<ReplicationTableColumnsData, ResponseError, TData>({
    queryKey: replicationKeys.tableColumns(projectRef, sourceId, tableId),
    queryFn: ({ signal }) =>
      fetchReplicationTableColumns({ projectRef, sourceId, tableId }, signal),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      typeof sourceId !== 'undefined' &&
      typeof tableId !== 'undefined',
    ...options,
  })

export const useReplicationTableColumnsQuery = <TData = ReplicationTableColumnsData>(
  { projectRef, sourceId, tableId }: ReplicationTableColumnsParams,
  options: ReplicationTableColumnsQueryOptions<TData> = {}
) => useQuery(replicationTableColumnsQueryOptions({ projectRef, sourceId, tableId }, options))
