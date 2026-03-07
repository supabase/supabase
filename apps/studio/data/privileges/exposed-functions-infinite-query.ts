import { infiniteQueryOptions } from '@tanstack/react-query'
import { executeSql } from 'data/sql/execute-sql-query'
import type { ResponseError } from 'types'

import { privilegeKeys } from './keys'
import { getExposedFunctionsSql } from './privileges.sql'

export const EXPOSED_FUNCTIONS_PAGE_LIMIT = 50

export type ExposedFunctionsVariables = {
  projectRef?: string
  connectionString?: string | null
  search?: string
}

export type ExposedFunction = {
  schema: string
  name: string
  status: 'granted' | 'revoked' | 'custom'
}

export type ExposedFunctionsResponse = {
  total_count: number
  functions: ExposedFunction[]
}

export async function getExposedFunctions(
  {
    projectRef,
    connectionString,
    search,
    page = 0,
    limit = EXPOSED_FUNCTIONS_PAGE_LIMIT,
  }: ExposedFunctionsVariables & { page?: number; limit?: number },
  signal?: AbortSignal
): Promise<ExposedFunctionsResponse> {
  if (!projectRef) throw new Error('projectRef is required')

  const offset = page * limit

  const sql = getExposedFunctionsSql({ search, offset, limit })

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['exposed-functions', page],
    },
    signal
  )

  return result[0] as ExposedFunctionsResponse
}

export type ExposedFunctionsData = Awaited<ReturnType<typeof getExposedFunctions>>
export type ExposedFunctionsError = ResponseError

export const exposedFunctionsInfiniteQueryOptions = (
  { projectRef, connectionString, search }: ExposedFunctionsVariables,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  return infiniteQueryOptions({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- connection string doesn't change the result of the query
    queryKey: privilegeKeys.exposedFunctionsInfinite(projectRef, search),
    queryFn: ({ signal, pageParam }) =>
      getExposedFunctions(
        {
          projectRef,
          connectionString,
          search,
          page: pageParam,
        },
        signal
      ),
    enabled: enabled && typeof projectRef !== 'undefined',
    initialPageParam: 0,
    getNextPageParam(lastPage, pages) {
      const page = pages.length
      const currentTotalCount = page * EXPOSED_FUNCTIONS_PAGE_LIMIT
      const totalCount = lastPage.total_count ?? 0

      if (currentTotalCount >= totalCount) {
        return undefined
      }

      return page
    },
  })
}
