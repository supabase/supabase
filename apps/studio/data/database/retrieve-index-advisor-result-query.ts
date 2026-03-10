import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'

import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError, UseCustomQueryOptions } from 'types'
import { databaseKeys } from './keys'
import { filterProtectedSchemaIndexAdvisorResult } from 'components/interfaces/QueryPerformance/IndexAdvisor/index-advisor.utils'

export type GetIndexAdvisorResultVariables = {
  projectRef?: string
  connectionString?: string | null
  query: string
}

const IndexAdvisorResultSchema = z.object({
  errors: z.array(z.string()),
  index_statements: z.array(z.string()),
  startup_cost_before: z.number(),
  startup_cost_after: z.number(),
  total_cost_before: z.number(),
  total_cost_after: z.number(),
})

export type GetIndexAdvisorResultResponse = z.infer<typeof IndexAdvisorResultSchema>

export async function getIndexAdvisorResult({
  projectRef,
  connectionString,
  query,
}: GetIndexAdvisorResultVariables) {
  if (!projectRef) throw new Error('Project ref is required')

  const escapedQuery = query.replace(/'/g, "''")

  const { result: results } = await executeSql({
    projectRef,
    connectionString,
    sql: `set search_path to public, extensions; select * from index_advisor('${escapedQuery}');`,
  })

  if (!results || results.length === 0) {
    console.error('[index_advisor > getIndexAdvisorResult] No results from index_advisor')
    return null
  }

  const parsed = IndexAdvisorResultSchema.safeParse(results[0])
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]
    const errorPath = firstError.path.length > 0 ? ` at path: ${firstError.path.join('.')}` : ''
    console.error(
      `Invalid index advisor response${errorPath}: ${firstError.message}. Received: ${JSON.stringify(results[0])}`
    )
    return null
  }

  return filterProtectedSchemaIndexAdvisorResult(parsed.data)
}

export type GetIndexAdvisorResultData = Awaited<ReturnType<typeof getIndexAdvisorResult>>
export type GetIndexAdvisorResultError = ResponseError

export const useGetIndexAdvisorResult = <TData = GetIndexAdvisorResultData>(
  { projectRef, connectionString, query }: GetIndexAdvisorResultVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<GetIndexAdvisorResultData, GetIndexAdvisorResultError, TData> = {}
) =>
  useQuery<GetIndexAdvisorResultData, GetIndexAdvisorResultError, TData>({
    queryKey: databaseKeys.indexAdvisorFromQuery(projectRef, query),
    queryFn: () => getIndexAdvisorResult({ projectRef, connectionString, query }),
    retry: false,
    enabled:
      (enabled &&
        typeof projectRef !== 'undefined' &&
        typeof query !== 'undefined' &&
        (query.startsWith('select') || query.startsWith('SELECT'))) ||
      (typeof query === 'string' && query.trim().toLowerCase().startsWith('with pgrst_source')),
    ...options,
  })
