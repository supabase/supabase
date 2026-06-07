import { getTablesPaginatedSql, type PGTable } from '@supabase/pg-meta'
import { DEFAULT_PLATFORM_APPLICATION_NAME } from '@supabase/pg-meta/src/constants'
import { InfiniteData, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query'
import { sortBy } from 'lodash'
import { useCallback } from 'react'

import { tableKeys } from './keys'
import { get, handleError } from '@/data/fetchers'
import { executeSql } from '@/data/sql/execute-sql-query'
import type { SafePostgresTable } from '@/lib/postgres-types'
import type { ResponseError, UseCustomInfiniteQueryOptions, UseCustomQueryOptions } from '@/types'

export type TablesVariables = {
  projectRef?: string
  connectionString?: string | null
  schema?: string
  /**
   * Defaults to false
   */
  includeColumns?: boolean
  sortByProperty?: keyof PGTable
}

export async function getTables(
  {
    projectRef,
    connectionString,
    schema,
    includeColumns = false,
    sortByProperty = 'name',
  }: TablesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  let queryParams: Record<string, string> = {
    //include_columns is a string, even though it's true or false
    include_columns: `${includeColumns}`,
  }
  if (schema) {
    queryParams.included_schemas = schema
  }

  const { data, error } = await get('/platform/pg-meta/{ref}/tables', {
    params: {
      header: {
        'x-connection-encrypted': connectionString!,
        'x-pg-application-name': DEFAULT_PLATFORM_APPLICATION_NAME,
      },
      path: { ref: projectRef },
      query: queryParams as any,
    },
    headers,
    signal,
  })

  if (!Array.isArray(data) && error) handleError(error)

  // Sort the data if the sortByName option is true
  if (Array.isArray(data) && sortByProperty) {
    return sortBy(data, (t) => t[sortByProperty]) as SafePostgresTable[]
  }

  return data as SafePostgresTable[]
}

export type TablesData = Awaited<ReturnType<typeof getTables>>
export type TablesError = ResponseError

export const useTablesQuery = <TData = TablesData>(
  { projectRef, connectionString, schema, includeColumns }: TablesVariables,
  { enabled = true, ...options }: UseCustomQueryOptions<TablesData, TablesError, TData> = {}
) => {
  return useQuery<TablesData, TablesError, TData>({
    queryKey: tableKeys.list(projectRef, schema, includeColumns),
    queryFn: ({ signal }) =>
      getTables({ projectRef, connectionString, schema, includeColumns }, signal),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
}

/**
 * useGetTables
 * Tries to get tables from the react-query cache, or loads it from the server if it's not cached.
 */
export function useGetTables({
  projectRef,
  connectionString,
}: Pick<TablesVariables, 'projectRef' | 'connectionString'>) {
  const queryClient = useQueryClient()

  return useCallback(
    (schema?: TablesVariables['schema'], includeColumns?: TablesVariables['includeColumns']) => {
      return queryClient.fetchQuery({
        queryKey: tableKeys.list(projectRef, schema, includeColumns),
        queryFn: ({ signal }) =>
          getTables({ projectRef, connectionString, schema, includeColumns }, signal),
      })
    },
    [connectionString, projectRef, queryClient]
  )
}

export function usePrefetchTables({
  projectRef,
  connectionString,
}: Pick<TablesVariables, 'projectRef' | 'connectionString'>) {
  const queryClient = useQueryClient()

  return useCallback(
    (schema?: TablesVariables['schema'], includeColumns?: TablesVariables['includeColumns']) => {
      return queryClient.prefetchQuery({
        queryKey: tableKeys.list(projectRef, schema, includeColumns),
        queryFn: ({ signal }) =>
          getTables({ projectRef, connectionString, schema, includeColumns }, signal),
      })
    },
    [connectionString, projectRef, queryClient]
  )
}

export type InfiniteTablesVariables = Pick<
  TablesVariables,
  'projectRef' | 'connectionString' | 'schema' | 'includeColumns'
> & {
  pageSize?: number
  nameFilter?: string
}

export async function getTablesPage(
  {
    projectRef,
    connectionString,
    schema,
    includeColumns = false,
    limit,
    afterOid,
    nameFilter,
  }: Pick<TablesVariables, 'projectRef' | 'connectionString' | 'schema' | 'includeColumns'> & {
    limit: number
    afterOid: number
    nameFilter?: string
  },
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  const sql = getTablesPaginatedSql({ schema, includeColumns, limit, afterOid, nameFilter })

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: [
        `project:${projectRef}`,
        `schema:${schema}`,
        `infinite_tables`,
        includeColumns ? 'with_columns' : null,
        nameFilter ? `search:${nameFilter}` : null,
        limit ? `page_size:${limit}` : null,
        afterOid ? `after:${afterOid}` : null,
      ],
    },
    signal
  )

  return result as SafePostgresTable[]
}

export const useInfiniteTablesQuery = <TData = InfiniteData<TablesData>>(
  {
    projectRef,
    connectionString,
    schema,
    includeColumns,
    pageSize = 50,
    nameFilter,
  }: InfiniteTablesVariables,
  {
    enabled = true,
    ...options
  }: UseCustomInfiniteQueryOptions<TablesData, TablesError, TData, readonly unknown[], number> = {}
) => {
  return useInfiniteQuery({
    queryKey: tableKeys.infiniteList(projectRef, schema, { includeColumns, pageSize, nameFilter }),
    queryFn: ({ signal, pageParam }) =>
      getTablesPage(
        {
          projectRef,
          connectionString,
          schema,
          includeColumns,
          limit: pageSize,
          afterOid: pageParam,
          nameFilter,
        },
        signal
      ),
    enabled: enabled && typeof projectRef !== 'undefined',
    initialPageParam: 0,
    getNextPageParam: (lastPage) =>
      lastPage.length < pageSize ? undefined : lastPage[lastPage.length - 1].id,
    ...options,
  })
}
