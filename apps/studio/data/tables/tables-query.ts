import { PostgresTable } from '@supabase/postgres-meta'
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { ResponseError } from 'types'
import { tableKeys } from './keys'
import { Table } from './table-query'

export type TablesVariables = {
  projectRef?: string
  connectionString?: string
  schema?: string
}

export type TablesResponse = Table[] | { error?: any }

export async function getTables(
  { projectRef, connectionString, schema }: TablesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  let queryParams = new URLSearchParams()
  if (schema) queryParams.set('included_schemas', schema)
  const searchStr = queryParams.toString()

  const response = (await get(
    `${API_URL}/pg-meta/${projectRef}/tables${searchStr ? `?${searchStr}` : ''}`,
    {
      headers: Object.fromEntries(headers),
      signal,
    }
  )) as TablesResponse

  if (!Array.isArray(response) && response.error) {
    throw response.error
  }

  return response as PostgresTable[]
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
