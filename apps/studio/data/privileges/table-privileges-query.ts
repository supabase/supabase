import pgMeta from '@supabase/pg-meta'
import { QueryClient, UseQueryOptions, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { executeSql, ExecuteSqlError } from 'data/sql/execute-sql-query'
import { privilegeKeys } from './keys'

export type TablePrivilegesVariables = {
  projectRef?: string
  connectionString?: string
}

export type PgTablePrivileges = z.infer<typeof pgMeta.tablePrivileges.zod>

const pgMetaTablePrivilegesList = pgMeta.tablePrivileges.list()

export type TablePrivilegesData = z.infer<typeof pgMetaTablePrivilegesList.zod>
export type TablePrivilegesError = ExecuteSqlError

async function getTablePrivileges(
  { projectRef, connectionString }: TablePrivilegesVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql: pgMetaTablePrivilegesList.sql,
      queryKey: ['table-privileges'],
    },
    signal
  )

  return result as TablePrivilegesData
}

export const useTablePrivilegesQuery = <TData = TablePrivilegesData>(
  { projectRef, connectionString }: TablePrivilegesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<TablePrivilegesData, TablePrivilegesError, TData> = {}
) =>
  useQuery<TablePrivilegesData, TablePrivilegesError, TData>(
    privilegeKeys.tablePrivilegesList(projectRef),
    ({ signal }) => getTablePrivileges({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

export function invalidateTablePrivilegesQuery(
  client: QueryClient,
  projectRef: string | undefined
) {
  return client.invalidateQueries(privilegeKeys.tablePrivilegesList(projectRef))
}
