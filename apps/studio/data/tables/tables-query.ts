import { PostgresTable } from '@supabase/postgres-meta'
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { sortBy } from 'lodash'
import { useCallback } from 'react'
import { ResponseError } from 'types'
import { tableKeys } from './keys'

export type TablesVariables = {
  projectRef?: string
  connectionString?: string
  schema?: string
  sortByProperty?: keyof PostgresTable
}

export async function getTables(
  { projectRef, connectionString, schema, sortByProperty = 'name' }: TablesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  let queryParams = {}
  if (schema) {
    queryParams = { included_schemas: schema }
  }

  const { data, error } = await get('/platform/pg-meta/{ref}/tables', {
    params: {
      header: {
        'x-connection-encrypted': connectionString!,
      },
      path: {
        ref: projectRef,
      },
      query: queryParams as any,
    },
    headers,
    signal,
  })

  if (!Array.isArray(data) && error) {
    throw error
  }

  // Sort the data if the sortByName option is true
  if (Array.isArray(data) && sortByProperty) {
    return sortBy(data, (t) => t[sortByProperty]) as PostgresTable[]
  }
  return data as PostgresTable[]
}

export type TablesData = Awaited<ReturnType<typeof getTables>>
export type TablesError = ResponseError

export const useTablesQuery = <TData = TablesData>(
  { projectRef, connectionString, schema }: TablesVariables,
  { enabled = true, ...options }: UseQueryOptions<TablesData, TablesError, TData> = {}
) =>
  useQuery<TablesData, TablesError, TData>(
    tableKeys.list(projectRef, schema),
    ({ signal }) => getTables({ projectRef, connectionString, schema }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

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
    (schema?: TablesVariables['schema']) => {
      return queryClient.fetchQuery({
        queryKey: tableKeys.list(projectRef, schema),
        queryFn: ({ signal }) => getTables({ projectRef, connectionString, schema }, signal),
      })
    },
    [connectionString, projectRef, queryClient]
  )
}
