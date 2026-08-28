import { queryOptions, useQuery } from '@tanstack/react-query'
import type { components } from 'api-types'

import { REPLICATION_METADATA_FRESHNESS_MS } from './constants'
import { replicationKeys } from './keys'
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
): Promise<components['schemas']['PublicationDetailsResponse_Output']> {
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

  return data
}

export type ReplicationPublicationData = Awaited<ReturnType<typeof fetchReplicationPublication>>

type ReplicationPublicationQueryOptions<TData> = Omit<
  UseCustomQueryOptions<ReplicationPublicationData, ResponseError, TData>,
  'enabled'
> & { enabled?: boolean }

export const replicationPublicationQueryOptions = <TData = ReplicationPublicationData>(
  { projectRef, sourceId, publicationName }: ReplicationPublicationParams,
  { enabled = true, ...options }: ReplicationPublicationQueryOptions<TData> = {}
) =>
  queryOptions<ReplicationPublicationData, ResponseError, TData>({
    queryKey: replicationKeys.publication(projectRef, sourceId, publicationName),
    queryFn: ({ signal }) =>
      fetchReplicationPublication({ projectRef, sourceId, publicationName }, signal),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      typeof sourceId !== 'undefined' &&
      typeof publicationName !== 'undefined' &&
      publicationName.length > 0,
    staleTime: REPLICATION_METADATA_FRESHNESS_MS,
    ...options,
  })

export const useReplicationPublicationQuery = <TData = ReplicationPublicationData>(
  { projectRef, sourceId, publicationName }: ReplicationPublicationParams,
  options: ReplicationPublicationQueryOptions<TData> = {}
) =>
  useQuery(replicationPublicationQueryOptions({ projectRef, sourceId, publicationName }, options))
