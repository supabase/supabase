import { queryOptions, useQuery } from '@tanstack/react-query'

import { REPLICATION_METADATA_FRESHNESS_MS } from './constants'
import { replicationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import { useReplicationClusterId } from '@/state/replication-cluster'
import type { UseCustomQueryOptions } from '@/types'

type ReplicationPublicationNamesParams = {
  projectRef?: string
  sourceId?: number
  clusterId?: string
}

async function fetchReplicationPublicationNames(
  { projectRef, sourceId, clusterId }: ReplicationPublicationNamesParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!sourceId) throw new Error('sourceId is required')

  const { data, error } = await get(
    '/platform/replication/v2/{ref}/sources/{source_id}/publications',
    {
      params: { path: { ref: projectRef, source_id: sourceId }, query: { cluster_id: clusterId } },
      signal,
    }
  )
  if (error) handleError(error)

  return data.publications
    .filter(({ name }) => name !== 'supabase_realtime')
    .sort((a, b) => a.name.localeCompare(b.name))
}

export type ReplicationPublicationNamesData = Awaited<
  ReturnType<typeof fetchReplicationPublicationNames>
>

type ReplicationPublicationNamesQueryOptions<TData> = Omit<
  UseCustomQueryOptions<ReplicationPublicationNamesData, StudioError, TData>,
  'enabled'
> & { enabled?: boolean }

export const replicationPublicationNamesQueryOptions = <TData = ReplicationPublicationNamesData>(
  { projectRef, sourceId, clusterId }: ReplicationPublicationNamesParams,
  { enabled = true, ...options }: ReplicationPublicationNamesQueryOptions<TData> = {}
) =>
  queryOptions<ReplicationPublicationNamesData, StudioError, TData>({
    queryKey: replicationKeys.publicationNames(projectRef, sourceId, clusterId),
    queryFn: ({ signal }) =>
      fetchReplicationPublicationNames({ projectRef, sourceId, clusterId }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof sourceId !== 'undefined',
    staleTime: REPLICATION_METADATA_FRESHNESS_MS,
    ...options,
  })

export const useReplicationPublicationNamesQuery = <TData = ReplicationPublicationNamesData>(
  { projectRef, sourceId, clusterId: requestedClusterId }: ReplicationPublicationNamesParams,
  options: ReplicationPublicationNamesQueryOptions<TData> = {}
) => {
  const clusterId = useReplicationClusterId(requestedClusterId)
  return useQuery(
    replicationPublicationNamesQueryOptions({ projectRef, sourceId, clusterId }, options)
  )
}
