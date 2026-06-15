import pgMeta from '@supabase/pg-meta'
import { QueryClient, useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { privilegeKeys } from './keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { UseCustomQueryOptions } from '@/types'

export type TablePrivilegesVariables = {
  projectRef?: string
  connectionString?: string | null
  includedSchemas?: string[]
}

export type PgTablePrivileges = z.infer<typeof pgMeta.tablePrivileges.zod>

const pgMetaTablePrivilegesList = pgMeta.tablePrivileges.list()
export type TablePrivilegesData = z.infer<typeof pgMetaTablePrivilegesList.zod>
export type TablePrivilegesError = ExecuteSqlError

async function getTablePrivileges(
  { projectRef, connectionString, includedSchemas }: TablePrivilegesVariables,
  signal?: AbortSignal
) {
  const sql = pgMeta.tablePrivileges.list({ includedSchemas }).sql
  const queryKey = !!includedSchemas
    ? [`table-privileges?schemas=${includedSchemas.join(',')}`]
    : ['table-privileges']

  const { result } = await executeSql({ projectRef, connectionString, sql, queryKey }, signal)

  return result as TablePrivilegesData
}

export const useTablePrivilegesQuery = <TData = TablePrivilegesData>(
  vars: TablePrivilegesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<TablePrivilegesData, TablePrivilegesError, TData> = {}
) => {
  const { projectRef, includedSchemas } = vars
  return useQuery<TablePrivilegesData, TablePrivilegesError, TData>({
    queryKey: privilegeKeys.tablePrivilegesList(projectRef, includedSchemas),
    queryFn: ({ signal }) => getTablePrivileges(vars, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
}

export function invalidateTablePrivilegesQuery(
  client: QueryClient,
  projectRef: string | undefined
) {
  return client.invalidateQueries({ queryKey: privilegeKeys.tablePrivilegesList(projectRef) })
}
