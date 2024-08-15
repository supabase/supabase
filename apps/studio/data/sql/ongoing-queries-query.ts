import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, ExecuteSqlError, useExecuteSqlQuery } from '../sql/execute-sql-query'

type OngoingQuery = {
  pid: number
  query: string
  query_start: string
}

export const getOngoingQueries = () => {
  const sql = /* SQL */ `
select pid, query, query_start from pg_stat_activity where state = 'active' and datname = 'postgres';
`.trim()

  return sql
}

export type OngoingQueriesVariables = {
  projectRef?: string
  connectionString?: string
}

export type OngoingQueriesData = OngoingQuery[]
export type OngoingQueriesError = ExecuteSqlError

export const useOngoingQueriesQuery = <TData extends OngoingQueriesData = OngoingQueriesData>(
  { projectRef, connectionString }: OngoingQueriesVariables,
  options: UseQueryOptions<ExecuteSqlData, OngoingQueriesError, TData> = {}
) => {
  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getOngoingQueries(),
      queryKey: ['ongoing-queries'],
    },
    {
      ...options,
      select(data) {
        return (data?.result ?? []).filter(
          (x: OngoingQuery) => !x.query.startsWith(getOngoingQueries())
        )
      },
    }
  )
}
