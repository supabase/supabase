import { getTablesWithAnonAuthenticatedAccessSQL } from '@supabase/pg-meta/src/sql/studio/check-tables-anon-authenticated-access'
import { useQuery } from '@tanstack/react-query'

import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { tableKeys } from './keys'
import { UseCustomQueryOptions } from 'types'

type TablesRolesAccessArgs = {
  schema: string
}

export type TablesRolesAccessVariables = TablesRolesAccessArgs & {
  projectRef?: string
  connectionString?: string | null
}

export async function getTablesWithAnonAuthenticatedAccess(
  { schema, projectRef, connectionString }: TablesRolesAccessVariables,
  signal?: AbortSignal
) {
  if (!schema) throw new Error('schema is required')

  const sql = getTablesWithAnonAuthenticatedAccessSQL({ schema })

  const { result } = (await executeSql(
    { projectRef, connectionString, sql, queryKey: ['TablesRolesAccess', schema] },
    signal
  )) as { result: { table_name: string }[] }

  return new Set(result.map((r) => r.table_name))
}

export type TablesRolesAccessData = Awaited<ReturnType<typeof getTablesWithAnonAuthenticatedAccess>>
export type TablesRolesAccessError = ExecuteSqlError

export const useTablesRolesAccessQuery = <TData = TablesRolesAccessData>(
  { projectRef, connectionString, schema }: TablesRolesAccessVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<TablesRolesAccessData, TablesRolesAccessError, TData> = {}
) =>
  useQuery<TablesRolesAccessData, TablesRolesAccessError, TData>({
    queryKey: tableKeys.rolesAccess(projectRef, schema),
    queryFn: ({ signal }) =>
      getTablesWithAnonAuthenticatedAccess({ projectRef, connectionString, schema }, signal),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      typeof schema !== 'undefined' &&
      !!connectionString,
    ...options,
  })
