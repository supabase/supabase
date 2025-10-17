import { getTablesAnonAuthenticatedRolesAccessSQL } from '@supabase/pg-meta/src/sql/studio/check-tables-anon-authenticated-access'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { tableKeys } from './keys'

type TablesRolesAccessArgs = {
  schema: string
}

export type TablesRolesAccessVariables = TablesRolesAccessArgs & {
  projectRef?: string
  connectionString?: string | null
}

export async function getTablesRolesAccess(
  { schema, projectRef, connectionString }: TablesRolesAccessVariables,
  signal?: AbortSignal
) {
  if (!schema) throw new Error('schema is required')

  const sql = getTablesAnonAuthenticatedRolesAccessSQL({ schema })

  const { result } = (await executeSql(
    { projectRef, connectionString, sql, queryKey: ['TablesRolesAccess', schema] },
    signal
  )) as { result: { table_name: string; grantee: string; privilege_type: string }[] }

  const tablesWithRoles = result.reduce<Record<string, string[]>>((acc, row) => {
    const roles = acc[row.table_name] ?? []
    if (!roles.includes(row.grantee)) {
      roles.push(row.grantee)
    }
    acc[row.table_name] = roles
    return acc
  }, {})

  const roleOrder = ['anon', 'authenticated']
  Object.keys(tablesWithRoles).forEach((tableName) => {
    tablesWithRoles[tableName] = tablesWithRoles[tableName].sort(
      (a, b) => roleOrder.indexOf(a) - roleOrder.indexOf(b)
    )
  })

  return tablesWithRoles
}

export type TablesRolesAccessData = Awaited<ReturnType<typeof getTablesRolesAccess>>
export type TablesRolesAccessError = ExecuteSqlError

export const useTablesRolesAccessQuery = <TData = TablesRolesAccessData>(
  { projectRef, connectionString, schema }: TablesRolesAccessVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<TablesRolesAccessData, TablesRolesAccessError, TData> = {}
) =>
  useQuery<TablesRolesAccessData, TablesRolesAccessError, TData>(
    tableKeys.rolesAccess(projectRef, schema),
    ({ signal }) => getTablesRolesAccess({ projectRef, connectionString, schema }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof schema !== 'undefined',
      ...options,
    }
  )
