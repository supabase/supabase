import type { PostgresTable } from '@supabase/postgres-meta'
import { useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query'
import { sortBy } from 'lodash'
import { useCallback } from 'react'

import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { tableKeys } from './keys'

export type TablesVariables = {
  projectRef?: string
  connectionString?: string
  schema?: string
  /**
   * Defaults to false
   */
  includeColumns?: boolean
  sortByProperty?: keyof PostgresTable
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
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
      query: queryParams as any,
    },
    headers,
    signal,
  })

  if (!Array.isArray(data) && error) handleError(error)

  // Sort the data if the sortByName option is true
  if (Array.isArray(data) && sortByProperty) {
    return sortBy(data, (t) => t[sortByProperty]) as PostgresTable[]
  }
  return data as Omit<PostgresTable, 'columns'>[]
}

export type TablesData = Awaited<ReturnType<typeof getTables>>
export type TablesError = ResponseError

export const useTablesQuery = <TData = TablesData>(
  { projectRef, connectionString, schema, includeColumns }: TablesVariables,
  { enabled = true, ...options }: UseQueryOptions<TablesData, TablesError, TData> = {}
) => {
  return useQuery<TablesData, TablesError, TData>(
    tableKeys.list(projectRef, schema, includeColumns),
    ({ signal }) => getTables({ projectRef, connectionString, schema, includeColumns }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
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
