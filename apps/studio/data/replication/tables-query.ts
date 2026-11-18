import { queryOptions, useQuery } from '@tanstack/react-query'

import { REPLICATION_METADATA_FRESHNESS_MS } from './constants'
import { replicationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import { useReplicationClusterId } from '@/state/replication-cluster'
import type { UseCustomQueryOptions } from '@/types'

type ReplicationTablesParams = { projectRef?: string; sourceId?: number; clusterId?: string }

async function fetchReplicationTables(
  { projectRef, sourceId, clusterId }: ReplicationTablesParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!sourceId) throw new Error('sourceId is required')

  const { data, error } = await get('/platform/replication/v2/{ref}/sources/{source_id}/tables', {
    params: { path: { ref: projectRef, source_id: sourceId }, query: { cluster_id: clusterId } },
    signal,
  })
  if (error) {
    handleError(error)
  }

  return data.tables
}

export type ReplicationTablesData = Awaited<ReturnType<typeof fetchReplicationTables>>

type ReplicationTablesQueryOptions<TData> = Omit<
  UseCustomQueryOptions<ReplicationTablesData, StudioError, TData>,
  'enabled'
> & { enabled?: boolean }

export const replicationTablesQueryOptions = <TData = ReplicationTablesData>(
  { projectRef, sourceId, clusterId }: ReplicationTablesParams,
  { enabled = true, ...options }: ReplicationTablesQueryOptions<TData> = {}
) =>
  queryOptions<ReplicationTablesData, StudioError, TData>({
    queryKey: replicationKeys.tables(projectRef, sourceId, clusterId),
    queryFn: ({ signal }) => fetchReplicationTables({ projectRef, sourceId, clusterId }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof sourceId !== 'undefined',
    staleTime: REPLICATION_METADATA_FRESHNESS_MS,
    ...options,
  })

export const useReplicationTablesQuery = <TData = ReplicationTablesData>(
  { projectRef, sourceId, clusterId: requestedClusterId }: ReplicationTablesParams,
  options: ReplicationTablesQueryOptions<TData> = {}
) => {
  const clusterId = useReplicationClusterId(requestedClusterId)
  return useQuery(replicationTablesQueryOptions({ projectRef, sourceId, clusterId }, options))
}
