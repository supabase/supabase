import { getExposedTablesSql } from '@supabase/pg-meta'
import { infiniteQueryOptions } from '@tanstack/react-query'

import { privilegeKeys } from './keys'
import { executeSql } from '@/data/sql/execute-sql-query'
import { INTERNAL_SCHEMAS } from '@/hooks/useProtectedSchemas'
import type { ResponseError } from '@/types'

const IGNORED_SCHEMAS = [...INTERNAL_SCHEMAS, 'pg_catalog']
export const EXPOSED_TABLES_PAGE_LIMIT = 50

export type ExposedTablesVariables = {
  projectRef?: string
  connectionString?: string | null
  search?: string
}

export type ExposedTable = {
  id: number
  schema: string
  name: string
  status: 'granted' | 'revoked' | 'custom'
}

export type ExposedTablesResponse = {
  total_count: number
  tables: ExposedTable[]
}

export async function getExposedTables(
  {
    projectRef,
    connectionString,
    search,
    page = 0,
    limit = EXPOSED_TABLES_PAGE_LIMIT,
  }: ExposedTablesVariables & { page?: number; limit?: number },
  signal?: AbortSignal
): Promise<ExposedTablesResponse> {
  if (!projectRef) throw new Error('projectRef is required')

  const offset = page * limit

  const sql = getExposedTablesSql({ search, offset, limit, ignoredSchemas: IGNORED_SCHEMAS })

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['exposed-tables', page],
    },
    signal
  )

  return result[0] as ExposedTablesResponse
}

export type ExposedTablesData = Awaited<ReturnType<typeof getExposedTables>>
export type ExposedTablesError = ResponseError

export const exposedTablesInfiniteQueryOptions = (
  { projectRef, connectionString, search }: ExposedTablesVariables,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  return infiniteQueryOptions({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps -- connection string doesn't change the result of the query
    queryKey: privilegeKeys.exposedTablesInfinite(projectRef, search),
    queryFn: ({ signal, pageParam }) =>
      getExposedTables(
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
      const currentTotalCount = page * EXPOSED_TABLES_PAGE_LIMIT
      const totalCount = lastPage.total_count ?? 0

      if (currentTotalCount >= totalCount) {
        return undefined
      }

      return page
    },
  })
}
