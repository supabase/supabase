import type { PostgresTable } from '@supabase/postgres-meta'
import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get, handleError } from 'data/fetchers'
import { tableKeys } from './keys'

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
  if (!projectRef) throw new Error('projectRef is required')
  if (!id) throw new Error('id is required')

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/tables', {
    params: {
      header: { 'x-connection-encrypted': connectionString! },
      path: { ref: projectRef },
      // @ts-ignore
      query: { id: id.toString() },
    },
    headers,
    signal,
  })

  if (error) handleError(error)
  return data as unknown as PostgresTable
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
      staleTime: 0,
      ...options,
    }
  )

export function prefetchTable(
  client: QueryClient,
  { projectRef, connectionString, id }: TableVariables
) {
  return client.fetchQuery(tableKeys.table(projectRef, id), ({ signal }) =>
    getTable({ id, projectRef, connectionString }, signal)
  )
}
