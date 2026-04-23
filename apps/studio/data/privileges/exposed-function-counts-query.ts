import { getExposedFunctionCountsSql } from '@supabase/pg-meta'
import { queryOptions } from '@tanstack/react-query'

import { privilegeKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-query'
import { INTERNAL_SCHEMAS } from '@/hooks/useProtectedSchemas'
import type { ResponseError } from '@/types'

const IGNORED_SCHEMAS = [...INTERNAL_SCHEMAS, 'pg_catalog']

export type ExposedFunctionCountsVariables = {
  projectRef?: string
  connectionString?: string | null
  selectedSchemas: string[]
}

export type ExposedFunctionCountsResponse = {
  total_count: number
  grants_count: number
}

export async function getExposedFunctionCounts(
  { projectRef, connectionString, selectedSchemas }: ExposedFunctionCountsVariables,
  signal?: AbortSignal
): Promise<ExposedFunctionCountsResponse> {
  if (!projectRef) throw new Error('projectRef is required')
  if (!selectedSchemas) throw new Error('selectedSchemas is required')

  const sql = getExposedFunctionCountsSql({ selectedSchemas, ignoredSchemas: IGNORED_SCHEMAS })

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['exposed-function-counts', selectedSchemas],
    },
    signal
  )

  return result[0] as ExposedFunctionCountsResponse
}

export type ExposedFunctionCountsData = Awaited<ReturnType<typeof getExposedFunctionCounts>>
export type ExposedFunctionCountsError = ResponseError

export const exposedFunctionCountsQueryOptions = (
  { projectRef, connectionString, selectedSchemas }: ExposedFunctionCountsVariables,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  return queryOptions({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- connection string doesn't change the result of the query
    queryKey: privilegeKeys.exposedFunctionCounts(projectRef, selectedSchemas),
    queryFn: ({ signal }) =>
      getExposedFunctionCounts(
        {
          projectRef,
          connectionString,
          selectedSchemas,
        },
        signal
      ),
    enabled: enabled && typeof projectRef !== 'undefined',
  })
}
