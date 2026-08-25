import { useQuery } from '@tanstack/react-query'
import { components } from 'api-types'

import { replicationKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type ReplicationPublicationsParams = { projectRef?: string; sourceId?: number }

export type ReplicationPublication = {
  name: string
  tables: components['schemas']['PublicationDetailsResponse']['tables']
  config: components['schemas']['PublicationDetailsResponse']['config']
}

async function fetchReplicationPublications(
  { projectRef, sourceId }: ReplicationPublicationsParams,
  signal?: AbortSignal
): Promise<ReplicationPublication[]> {
  if (!projectRef) throw new Error('projectRef is required')

  if (!sourceId) throw new Error('sourceId is required')

  const { data: listData, error: listError } = await get(
    '/platform/replication/{ref}/v2/sources/{source_id}/publications',
    {
      params: { path: { ref: projectRef, source_id: sourceId } },
      signal,
    }
  )
  if (listError) {
    handleError(listError)
  }

  // supabase_realtime is an internal publication and never worth resolving details for.
  const names = listData.publications
    .map((pub) => pub.name)
    .filter((name) => name !== 'supabase_realtime')

  const publications = await Promise.all(
    names.map(async (name) => {
      const { data, error } = await get(
        '/platform/replication/{ref}/v2/sources/{source_id}/publications/{publication_name}',
        {
          params: {
            path: { ref: projectRef, source_id: sourceId, publication_name: name },
          },
          signal,
        }
      )
      if (error) {
        handleError(error)
      }
      return { name: data.name, tables: data.tables, config: data.config }
    })
  )

  // Publications with no tables would cause validation to fail, so filter them out.
  const filteredPublications = publications.filter((pub) => pub.tables.length > 0)

  // Sort publications alphabetically by name
  return filteredPublications.sort((a, b) => a.name.localeCompare(b.name))
}

export type ReplicationPublicationsData = Awaited<ReturnType<typeof fetchReplicationPublications>>

export const useReplicationPublicationsQuery = <TData = ReplicationPublicationsData>(
  { projectRef, sourceId }: ReplicationPublicationsParams,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ReplicationPublicationsData, ResponseError, TData> = {}
) =>
  useQuery<ReplicationPublicationsData, ResponseError, TData>({
    queryKey: replicationKeys.publications(projectRef, sourceId),
    queryFn: ({ signal }) => fetchReplicationPublications({ projectRef, sourceId }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof sourceId !== 'undefined',
    ...options,
  })
