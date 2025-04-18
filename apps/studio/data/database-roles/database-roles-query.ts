import pgMeta from '@supabase/pg-meta'
import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { executeSql, ExecuteSqlError } from 'data/sql/execute-sql-query'
import { databaseRoleKeys } from './keys'

export type DatabaseRolesVariables = {
  projectRef?: string
  connectionString?: string
}

export type PgRole = z.infer<typeof pgMeta.roles.zod>

const pgMetaRolesList = pgMeta.roles.list()

export async function getDatabaseRoles(
  { projectRef, connectionString }: DatabaseRolesVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql(
    { projectRef, connectionString, sql: pgMetaRolesList.sql, queryKey: ['database-roles'] },
    signal
  )

  return result as PgRole[]
}

export type DatabaseRolesData = z.infer<typeof pgMetaRolesList.zod>
export type DatabaseRolesError = ExecuteSqlError

export const useDatabaseRolesQuery = <TData = DatabaseRolesData>(
  { projectRef, connectionString }: DatabaseRolesVariables,
  { enabled = true, ...options }: UseQueryOptions<DatabaseRolesData, DatabaseRolesError, TData> = {}
) =>
  useQuery<DatabaseRolesData, DatabaseRolesError, TData>(
    databaseRoleKeys.databaseRoles(projectRef),
    ({ signal }) => getDatabaseRoles({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

export function invalidateRolesQuery(client: QueryClient, projectRef: string | undefined) {
  return client.invalidateQueries(databaseRoleKeys.databaseRoles(projectRef))
}
