import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { tableKeys } from './keys'

type TableRolesAccessArgs = {
  schema: string
  table: string
}

/**
 * [Joshen] Specifically just checking for anon and authenticated roles since this is
 * just to verify if the table is exposed via the Supabase API
 */
export const getTableRolesAccessSql = ({ schema, table }: TableRolesAccessArgs) => {
  const sql = /* SQL */ `
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = '${schema}'
  AND table_name = '${table}'
  AND grantee IN ('anon', 'authenticated');
`.trim()

  return sql
}

export type TableRolesAccessVariables = TableRolesAccessArgs & {
  projectRef?: string
  connectionString?: string | null
}

export async function getTableRolesAccess(
  { schema, table, projectRef, connectionString }: TableRolesAccessVariables,
  signal?: AbortSignal
) {
  if (!schema) {
    throw new Error('schema is required')
  }

  const sql = getTableRolesAccessSql({ schema, table })

  const { result } = (await executeSql(
    { projectRef, connectionString, sql, queryKey: ['TableRolesAccess', schema] },
    signal
  )) as { result: { grantee: string; privilege_type: string }[] }

  const res = []
  if (result.some((x) => x.grantee === 'anon')) res.push('anon')
  if (result.some((x) => x.grantee === 'authenticated')) res.push('authenticated')

  return res
}

export type TableRolesAccessData = Awaited<ReturnType<typeof getTableRolesAccess>>
export type TableRolesAccessError = ExecuteSqlError

export const useTableRolesAccessQuery = <TData = TableRolesAccessData>(
  { projectRef, connectionString, schema, table }: TableRolesAccessVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<TableRolesAccessData, TableRolesAccessError, TData> = {}
) =>
  useQuery<TableRolesAccessData, TableRolesAccessError, TData>(
    tableKeys.rolesAccess(projectRef, schema, table),
    ({ signal }) => getTableRolesAccess({ projectRef, connectionString, schema, table }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof schema !== 'undefined',
      ...options,
    }
  )
