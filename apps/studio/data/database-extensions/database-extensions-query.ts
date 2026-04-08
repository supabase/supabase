import { getDatabaseExtensionsSQL } from '@supabase/pg-meta/src'
import { useQuery } from '@tanstack/react-query'
import { components } from 'api-types'

import { databaseExtensionsKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type DatabaseExtension = components['schemas']['PostgresExtension'] & {
  default_version_schema: string | null
}

export type DatabaseExtensionsVariables = {
  projectRef?: string
  connectionString?: string | null
}

export async function getDatabaseExtensions(
  { projectRef, connectionString }: DatabaseExtensionsVariables,
  signal?: AbortSignal
) {
  const sql = getDatabaseExtensionsSQL()
  const { result } = await executeSql(
    { projectRef, connectionString, sql, queryKey: ['database-extensions'] },
    signal
  )
  return result as DatabaseExtension[]
}

export type DatabaseExtensionsData = Awaited<ReturnType<typeof getDatabaseExtensions>>
export type DatabaseExtensionsError = ResponseError

export const useDatabaseExtensionsQuery = <TData = DatabaseExtensionsData>(
  { projectRef, connectionString }: DatabaseExtensionsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<DatabaseExtensionsData, DatabaseExtensionsError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<DatabaseExtensionsData, DatabaseExtensionsError, TData>({
    queryKey: databaseExtensionsKeys.list(projectRef),
    queryFn: ({ signal }) => getDatabaseExtensions({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && isActive,
    ...options,
  })
}
