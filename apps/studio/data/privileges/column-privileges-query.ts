import pgMeta from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { executeSql } from '../sql/execute-sql-mutation'
import { privilegeKeys } from './keys'
import type { components } from '@/data/api'
import { isScopedIntrospection, scopedIntrospectionReady } from '@/data/scoped-introspection'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type ColumnPrivilegesVariables = {
  projectRef?: string
  connectionString?: string | null
  /**
   * Required to keep this off the whole-catalog path: without it the query
   * aclexplodes every relation in the database across every one of its columns.
   */
  schema: string
  /**
   * Restricts to a single relation. The UI only ever renders one table at a
   * time, so this keeps the query scoped to what's on screen -- without it the
   * whole schema's columns are fetched and all but one table discarded. The
   * query stays disabled until a table is selected.
   */
  table?: string
}

export type ColumnPrivilege = components['schemas']['PostgresColumnPrivileges']

const pgMetaColumnPrivilegesList = pgMeta.columnPrivileges.list()
type ColumnPrivilegesData = z.infer<typeof pgMetaColumnPrivilegesList.zod>

export async function getColumnPrivileges(
  { projectRef, connectionString, schema, table }: ColumnPrivilegesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  // Cold-load race guard -- see the module comment on scoped-introspection.ts.
  await scopedIntrospectionReady()
  const sql = pgMeta.columnPrivileges.list({
    includedSchemas: [schema],
    relationName: table,
    scoped: isScopedIntrospection(),
  }).sql
  const queryKey = ['column-privileges', schema, table]
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
  const { projectRef, schema, table } = vars
  return useQuery<ColumnPrivilegesData, ColumnPrivilegesError, TData>({
    queryKey: privilegeKeys.columnPrivilegesList(projectRef, schema, table),
    queryFn: ({ signal }) => getColumnPrivileges(vars, signal),
    enabled:
      enabled &&
      typeof projectRef !== 'undefined' &&
      typeof schema !== 'undefined' &&
      typeof table !== 'undefined',
    ...options,
  })
}
