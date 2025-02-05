import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { ResponseError } from 'types'
import { replicationKeys } from './keys'

type ReplicationPublicationsParams = { projectRef?: string; sourceId?: number }

async function fetchReplicationPublications(
  { projectRef, sourceId }: ReplicationPublicationsParams,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  if (!sourceId) throw new Error('sourceId is required')

  const { data, error } = await get(
    '/platform/replication/{ref}/sources/{source_id}/publications',
    {
      params: { path: { ref: projectRef, source_id: sourceId } },
      signal,
    }
  )
  if (error) {
    handleError(error)
  }

  return data.publications.filter((pub) => pub.name !== 'supabase_realtime')
}

export type ReplicationPublicationsData = Awaited<ReturnType<typeof fetchReplicationPublications>>

export const useReplicationPublicationsQuery = <TData = ReplicationPublicationsData>(
  { projectRef, sourceId }: ReplicationPublicationsParams,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ReplicationPublicationsData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationPublicationsData, ResponseError, TData>(
    replicationKeys.publications(projectRef, sourceId),
    ({ signal }) => fetchReplicationPublications({ projectRef, sourceId }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof sourceId !== 'undefined',
      ...options,
    }
  )
