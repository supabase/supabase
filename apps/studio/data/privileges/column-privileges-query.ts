import { UseQueryOptions, useQuery } from '@tanstack/react-query'

import type { components } from 'data/api'
import type { ResponseError } from 'types'
import pgMeta from '@supabase/pg-meta'
import { executeSql } from 'data/sql/execute-sql-query'
import { privilegeKeys } from './keys'

export type ColumnPrivilegesVariables = {
  projectRef?: string
  connectionString?: string | null
}

export type ColumnPrivilege = components['schemas']['PostgresColumnPrivileges']

export async function getColumnPrivileges(
  { projectRef, connectionString }: ColumnPrivilegesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { sql, zod } = pgMeta.columnPrivileges.list()

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['column-privileges', 'list'],
    },
    signal
  )

  return zod.parse(result)
}

export type ColumnPrivilegesData = Awaited<ReturnType<typeof getColumnPrivileges>>
export type ColumnPrivilegesError = ResponseError

export const useColumnPrivilegesQuery = <TData = ColumnPrivilegesData>(
  { projectRef, connectionString }: ColumnPrivilegesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ColumnPrivilegesData, ColumnPrivilegesError, TData> = {}
) =>
  useQuery<ColumnPrivilegesData, ColumnPrivilegesError, TData>(
    privilegeKeys.columnPrivilegesList(projectRef),
    ({ signal }) => getColumnPrivileges({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
