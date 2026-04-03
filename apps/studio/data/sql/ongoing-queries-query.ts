import { getOngoingQueriesSql } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { sqlKeys } from './keys'
import { executeSql, ExecuteSqlError } from '@/data/sql/execute-sql-query'
import { UseCustomQueryOptions } from '@/types'

type OngoingQuery = {
  pid: number
  query: string
  query_start: string
}

export type OngoingQueriesVariables = {
  projectRef?: string
  connectionString?: string | null
}

export async function getOngoingQueries(
  { projectRef, connectionString }: OngoingQueriesVariables,
  signal?: AbortSignal
) {
  const sql = getOngoingQueriesSql()

  const { result } = await executeSql(
    { projectRef, connectionString, sql, queryKey: ['ongoing-queries'] },
    signal
  )

  return (result ?? []).filter((x: OngoingQuery) => !x.query.startsWith(sql)) as OngoingQuery[]
}

export type OngoingQueriesData = Awaited<ReturnType<typeof getOngoingQueries>>
export type OngoingQueriesError = ExecuteSqlError

export const useOngoingQueriesQuery = <TData = OngoingQueriesData>(
  { projectRef, connectionString }: OngoingQueriesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<OngoingQueriesData, OngoingQueriesError, TData> = {}
) =>
  useQuery<OngoingQueriesData, OngoingQueriesError, TData>({
    queryKey: sqlKeys.ongoingQueries(projectRef),
    queryFn: ({ signal }) => getOngoingQueries({ projectRef, connectionString }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
