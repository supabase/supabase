import pgMeta from '@supabase/pg-meta'
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
  const { sql, zod } = pgMeta.tables.retrieve({ name, schema })

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: tableKeys.retrieve(projectRef, name, schema),
    },
    signal
  )
  return zod.parse(result[0])
}

export type RetrieveTableResult = Awaited<ReturnType<typeof getTable>>
export type RetrieveTableError = ResponseError
export type RetrievedTableColumn = NonNullable<RetrieveTableResult['columns']>[number]

export const useTablesQuery = <TData = RetrieveTableResult>(
  { projectRef, connectionString, name, schema }: TablesVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<RetrieveTableResult, RetrieveTableError, TData> = {}
) => {
  return useQuery<RetrieveTableResult, RetrieveTableError, TData>(
    tableKeys.retrieve(projectRef, name, schema),
    ({ signal }) => getTable({ projectRef, connectionString, name, schema }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
}
