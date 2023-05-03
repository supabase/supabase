import { PostgresTable } from '@supabase/postgres-meta'
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { tableKeys } from './keys'
import { useCallback } from 'react'

export type TableVariables = {
  id?: number
  projectRef?: string
  connectionString?: string
}

export type Table = PostgresTable

export type TableResponse = Table | { error?: any }

export async function getTable(
  { id, projectRef, connectionString }: TableVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }
  if (!id) {
    throw new Error('id is required')
  }

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const response = (await get(`${API_URL}/pg-meta/${projectRef}/tables?id=${id}`, {
    headers: Object.fromEntries(headers),
    signal,
  })) as TableResponse

  if ('error' in response) {
    throw response.error
  }

  return response as PostgresTable
}

export type TableData = Awaited<ReturnType<typeof getTable>>
export type TableError = unknown

export const useTableQuery = <TData = TableData>(
  { projectRef, connectionString, id }: TableVariables,
  { enabled = true, ...options }: UseQueryOptions<TableData, TableError, TData> = {}
) =>
  useQuery<TableData, TableError, TData>(
    tableKeys.table(projectRef, id),
    ({ signal }) => getTable({ projectRef, connectionString, id }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined',
      ...options,
    }
  )

/**
 * useGetTable
 * Tries to get a table from the react-query cache, or loads it from the server if it's not cached.
 */
export function useGetTable({
  projectRef,
  connectionString,
}: Pick<TableVariables, 'projectRef' | 'connectionString'>) {
  const queryClient = useQueryClient()

  return useCallback(
    (id: NonNullable<TableVariables['id']>) => {
      return queryClient.fetchQuery({
        queryKey: tableKeys.table(projectRef, id),
        queryFn: ({ signal }) => getTable({ id, projectRef, connectionString }, signal),
      })
    },
    [connectionString, projectRef, queryClient]
  )
}
