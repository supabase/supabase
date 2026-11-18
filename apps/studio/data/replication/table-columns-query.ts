import { queryOptions, useQuery } from '@tanstack/react-query'

import { REPLICATION_METADATA_FRESHNESS_MS } from './constants'
import { replicationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import { useReplicationClusterId } from '@/state/replication-cluster'
import type { UseCustomQueryOptions } from '@/types'

type ReplicationTableColumnsParams = {
  projectRef?: string
  sourceId?: number
  tableId?: number
  clusterId?: string
}

async function fetchReplicationTableColumns(
  { projectRef, sourceId, tableId, clusterId }: ReplicationTableColumnsParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!sourceId) throw new Error('sourceId is required')
  if (tableId === undefined) throw new Error('tableId is required')

  const { data, error } = await get(
    '/platform/replication/v2/{ref}/sources/{source_id}/tables/{table_id}/columns',
    {
      params: {
        path: { ref: projectRef, source_id: sourceId, table_id: tableId },
        query: { cluster_id: clusterId },
      },
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
  UseCustomQueryOptions<ReplicationTableColumnsData, StudioError, TData>,
  'enabled'
> & { enabled?: boolean }

export const replicationTableColumnsQueryOptions = <TData = ReplicationTableColumnsData>(
  { projectRef, sourceId, tableId, clusterId }: ReplicationTableColumnsParams,
  { enabled = true, ...options }: ReplicationTableColumnsQueryOptions<TData> = {}
) =>
  queryOptions<ReplicationTableColumnsData, StudioError, TData>({
    queryKey: replicationKeys.tableColumns(projectRef, sourceId, tableId, clusterId),
    queryFn: ({ signal }) =>
      fetchReplicationTableColumns({ projectRef, sourceId, tableId, clusterId }, signal),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      typeof sourceId !== 'undefined' &&
      typeof tableId !== 'undefined',
    staleTime: REPLICATION_METADATA_FRESHNESS_MS,
    ...options,
  })

export const useReplicationTableColumnsQuery = <TData = ReplicationTableColumnsData>(
  { projectRef, sourceId, tableId, clusterId: requestedClusterId }: ReplicationTableColumnsParams,
  options: ReplicationTableColumnsQueryOptions<TData> = {}
) => {
  const clusterId = useReplicationClusterId(requestedClusterId)
  return useQuery(
    replicationTableColumnsQueryOptions({ projectRef, sourceId, tableId, clusterId }, options)
  )
}
