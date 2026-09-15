import pgMeta, { type PGPublication } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { executeSql } from '../sql/execute-sql-mutation'
import { databasePublicationsKeys } from './keys'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type DatabasePublicationsVariables = {
  projectRef?: string
  connectionString?: string | null
}

export async function getDatabasePublications(
  { projectRef, connectionString }: DatabasePublicationsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { sql } = pgMeta.publications.list()
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['publications'].filter(Boolean),
    },
    signal
  )

  return result as PGPublication[]
}

export type DatabasePublicationsData = Awaited<ReturnType<typeof getDatabasePublications>>
export type DatabasePublicationsError = ResponseError

export const useDatabasePublicationsQuery = <TData = DatabasePublicationsData>(
  { projectRef, connectionString }: DatabasePublicationsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<DatabasePublicationsData, DatabasePublicationsError, TData> = {}
) =>
  useQuery<DatabasePublicationsData, DatabasePublicationsError, TData>({
    queryKey: databasePublicationsKeys.list(projectRef),
    queryFn: ({ signal }) => getDatabasePublications({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })

export const useIsTableRealtimeEnabled = ({ id }: { id: number }) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: publications } = useDatabasePublicationsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const realtimePublication = (publications ?? []).find(
    (publication) => publication.name === 'supabase_realtime'
  )
  const realtimeEnabledTables = realtimePublication?.tables ?? []
  const isRealtimeEnabled = realtimeEnabledTables.some((t) => t.id === id)
  return isRealtimeEnabled
}
