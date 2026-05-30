import { getFDWsSql } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { fdwKeys } from './keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { UseCustomQueryOptions } from '@/types'

export type FDWColumn = {
  name: string
  type: string
}

export type FDWTable = {
  id: string
  name: string
  schema: string
  columns: FDWColumn[]
  options: string[]
}

export type FDW = {
  id: number
  name: string
  handler: string
  server_name: string
  server_options: string[] | null
  tables: FDWTable[]
}

export type FDWsVariables = {
  projectRef?: string
  connectionString?: string | null
}

export async function getFDWs(
  { projectRef, connectionString }: FDWsVariables,
  signal?: AbortSignal
) {
  const sql = getFDWsSql()

  const { result } = await executeSql(
    { projectRef, connectionString, sql, queryKey: ['fdws'] },
    signal
  )

  return result as FDW[]
}

export type FDWsData = Awaited<ReturnType<typeof getFDWs>>
export type FDWsError = ExecuteSqlError

export const useFDWsQuery = <TData = FDWsData>(
  { projectRef, connectionString }: FDWsVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<FDWsData, FDWsError, TData> = {}
) =>
  useQuery<FDWsData, FDWsError, TData>({
    queryKey: fdwKeys.list(projectRef),
    queryFn: ({ signal }) => getFDWs({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
