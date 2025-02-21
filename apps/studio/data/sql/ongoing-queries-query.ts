import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { sqlKeys } from './keys'

type OngoingQuery = {
  pid: number
  query: string
  query_start: string
}

export const getOngoingQueriesSql = () => {
  const sql = /* SQL */ `
select pid, query, query_start from pg_stat_activity where state = 'active' and datname = 'postgres';
`.trim()

  return sql
}

export type OngoingQueriesVariables = {
  projectRef?: string
  connectionString?: string
}

export async function getOngoingQueries(
  { projectRef, connectionString }: OngoingQueriesVariables,
  signal?: AbortSignal
) {
  const sql = getOngoingQueriesSql().trim()

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
  }: UseQueryOptions<OngoingQueriesData, OngoingQueriesError, TData> = {}
) =>
  useQuery<OngoingQueriesData, OngoingQueriesError, TData>(
    sqlKeys.ongoingQueries(projectRef),
    ({ signal }) => getOngoingQueries({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
