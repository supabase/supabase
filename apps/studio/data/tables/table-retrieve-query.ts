import pgMeta from '@supabase/pg-meta'
import { PostgresTable } from '@supabase/postgres-meta'
import { useQuery, type UseQueryOptions } from '@tanstack/react-query'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { tableKeys } from './keys'

export type TablesVariables = {
  projectRef?: string
  connectionString?: string | null
  name: string
  schema: string
}

export async function getTable(
  { projectRef, connectionString, name, schema }: TablesVariables,
  signal?: AbortSignal
) {
  const { sql } = pgMeta.tables.retrieve({ name, schema })

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: tableKeys.retrieve(projectRef, name, schema),
    },
    signal
  )

  return result[0] as PostgresTable
}

export type TablesData = Awaited<ReturnType<typeof getTable>>
export type TablesError = ResponseError

export const useTablesQuery = <TData = TablesData>(
  { projectRef, connectionString, name, schema }: TablesVariables,
  { enabled = true, ...options }: UseQueryOptions<TablesData, TablesError, TData> = {}
) => {
  return useQuery<TablesData, TablesError, TData>(
    tableKeys.retrieve(projectRef, name, schema),
    ({ signal }) => getTable({ projectRef, connectionString, name, schema }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
}
