import pgMeta from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { executeSql } from '../sql/execute-sql-mutation'
import { privilegeKeys } from './keys'
import type { components } from '@/data/api'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type ColumnPrivilegesVariables = {
  projectRef?: string
  connectionString?: string | null
  /**
   * [Joshen] Specifically requiring schema to prevent a heavy query on the DB
   * The only UI using this is the column privileges UI atm, so opting to be strict here
   * Ideally we'd be able to also filter based on table to be even more prudent, but
   * leaving out for now as it needs update to pg-meta + might not be worth the over-optimization
   * given this UI isn't a primary tool
   */
  schema: string
}

export type ColumnPrivilege = components['schemas']['PostgresColumnPrivileges']

const pgMetaColumnPrivilegesList = pgMeta.columnPrivileges.list()
type ColumnPrivilegesData = z.infer<typeof pgMetaColumnPrivilegesList.zod>

export async function getColumnPrivileges(
  { projectRef, connectionString, schema }: ColumnPrivilegesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const sql = pgMeta.columnPrivileges.list({ includedSchemas: [schema] }).sql
  const queryKey = ['column-privileges', schema]
  const { result } = await executeSql({ projectRef, connectionString, sql, queryKey }, signal)
  return result as ColumnPrivilegesData
}

export type ColumnPrivilegesError = ResponseError

export const useColumnPrivilegesQuery = <TData = ColumnPrivilegesData>(
  vars: ColumnPrivilegesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ColumnPrivilegesData, ColumnPrivilegesError, TData> = {}
) => {
  const { projectRef, schema } = vars
  return useQuery<ColumnPrivilegesData, ColumnPrivilegesError, TData>({
    queryKey: privilegeKeys.columnPrivilegesList(projectRef, schema),
    queryFn: ({ signal }) => getColumnPrivileges(vars, signal),
    enabled: enabled && typeof projectRef !== 'undefined' && typeof schema !== 'undefined',
    ...options,
  })
}
