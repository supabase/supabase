import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { tableKeys } from './keys'

type TableRolesAccessArgs = {
  schema: string
}

/**
 * [Joshen] Specifically just checking for anon and authenticated roles since this is
 * just to verify if the table is exposed via the Supabase API
 */
export const getTableRolesAccessSql = ({ schema }: TableRolesAccessArgs) => {
  const sql = /* SQL */ `
SELECT table_name, grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = '${schema}'
  AND grantee IN ('anon', 'authenticated');
`.trim()

  return sql
}

export type TableRolesAccessVariables = TableRolesAccessArgs & {
  projectRef?: string
  connectionString?: string | null
}

export async function getTableRolesAccess(
  { schema, projectRef, connectionString }: TableRolesAccessVariables,
  signal?: AbortSignal
) {
  if (!schema) {
    throw new Error('schema is required')
  }

  const sql = getTableRolesAccessSql({ schema })

  const { result } = (await executeSql(
    { projectRef, connectionString, sql, queryKey: ['TableRolesAccess', schema] },
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

export type TableRolesAccessData = Awaited<ReturnType<typeof getTableRolesAccess>>
export type TableRolesAccessError = ExecuteSqlError

export const useTableRolesAccessQuery = <TData = TableRolesAccessData>(
  { projectRef, connectionString, schema }: TableRolesAccessVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<TableRolesAccessData, TableRolesAccessError, TData> = {}
) =>
  useQuery<TableRolesAccessData, TableRolesAccessError, TData>(
    tableKeys.rolesAccess(projectRef, schema),
    ({ signal }) => getTableRolesAccess({ projectRef, connectionString, schema }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof schema !== 'undefined',
      ...options,
    }
  )
