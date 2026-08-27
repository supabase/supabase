import { useQuery } from '@tanstack/react-query'

import { REPLICATION_METADATA_FRESHNESS_MS } from './constants'
import { replicationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type ReplicationPublicationNamesParams = { projectRef?: string; sourceId?: number }

async function fetchReplicationPublicationNames(
  { projectRef, sourceId }: ReplicationPublicationNamesParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!sourceId) throw new Error('sourceId is required')

  const { data, error } = await get(
    '/platform/replication/v2/{ref}/sources/{source_id}/publications',
    {
      params: { path: { ref: projectRef, source_id: sourceId } },
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

export const useReplicationPublicationNamesQuery = <TData = ReplicationPublicationNamesData>(
  { projectRef, sourceId }: ReplicationPublicationNamesParams,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ReplicationPublicationNamesData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationPublicationNamesData, ResponseError, TData>({
    queryKey: replicationKeys.publicationNames(projectRef, sourceId),
    queryFn: ({ signal }) => fetchReplicationPublicationNames({ projectRef, sourceId }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof sourceId !== 'undefined',
    staleTime: REPLICATION_METADATA_FRESHNESS_MS,
    ...options,
  })
