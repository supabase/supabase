import { useQuery, UseQueryOptions } from '@tanstack/react-query'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type GetIndexAdvisorResultVariables = {
  projectRef?: string
  connectionString?: string
  query: string
}

export type GetIndexAdvisorResultResponse = {
  errors: string[]
  index_statements: string[]
  startup_cost_before: number
  startup_cost_after: number
  total_cost_before: number
  total_cost_after: number
}

export async function getIndexAdvisorResult({
  projectRef,
  connectionString,
  query,
}: GetIndexAdvisorResultVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  // swap single quotes for double to prevent syntax errors
  const escapedQuery = query.replace(/'/g, "''")

  const { result } = await executeSql({
    projectRef,
    connectionString,
    sql: `select * from index_advisor('${escapedQuery}');`,
  })
  return result[0] as GetIndexAdvisorResultResponse
}

export type GetIndexAdvisorResultData = Awaited<ReturnType<typeof getIndexAdvisorResult>>
export type GetIndexAdvisorResultError = ResponseError

export const useGetIndexAdvisorResult = <TData = GetIndexAdvisorResultData>(
  { projectRef, connectionString, query }: GetIndexAdvisorResultVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<GetIndexAdvisorResultData, GetIndexAdvisorResultError, TData> = {}
) =>
  useQuery<GetIndexAdvisorResultData, GetIndexAdvisorResultError, TData>(
    databaseKeys.indexAdvisorFromQuery(projectRef, query),
    () => getIndexAdvisorResult({ projectRef, connectionString, query }),
    {
      retry: false,
      enabled:
        (enabled &&
          typeof projectRef !== 'undefined' &&
          typeof query !== 'undefined' &&
          (query.startsWith('select') || query.startsWith('SELECT'))) ||
        query.trim().toLowerCase().startsWith('with pgrst_source'),
      ...options,
    }
  )
