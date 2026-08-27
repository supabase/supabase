import { useQuery } from '@tanstack/react-query'

import { replicationKeys } from './keys'
import type { ReplicationPublication } from './publications-query'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type ReplicationPublicationParams = {
  projectRef?: string
  sourceId?: number
  publicationName?: string
}

async function fetchReplicationPublication(
  { projectRef, sourceId, publicationName }: ReplicationPublicationParams,
  signal?: AbortSignal
): Promise<ReplicationPublication> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!sourceId) throw new Error('sourceId is required')
  if (!publicationName) throw new Error('publicationName is required')

  const { data, error } = await get(
    '/platform/replication/v2/{ref}/sources/{source_id}/publications/{publication_name}',
    {
      params: {
        path: { ref: projectRef, source_id: sourceId, publication_name: publicationName },
      },
      signal,
    }
  )
  if (error) handleError(error)

  return { name: data.name, tables: data.tables, config: data.config }
}

export type ReplicationPublicationData = Awaited<ReturnType<typeof fetchReplicationPublication>>

export const useReplicationPublicationQuery = <TData = ReplicationPublicationData>(
  { projectRef, sourceId, publicationName }: ReplicationPublicationParams,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ReplicationPublicationData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationPublicationData, ResponseError, TData>({
    queryKey: replicationKeys.publication(projectRef, sourceId, publicationName),
    queryFn: ({ signal }) =>
      fetchReplicationPublication({ projectRef, sourceId, publicationName }, signal),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      typeof sourceId !== 'undefined' &&
      typeof publicationName !== 'undefined' &&
      publicationName.length > 0,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    ...options,
  })
