import { PostgresTable } from '@supabase/postgres-meta'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { tableKeys } from './keys'
import { Table } from './table-query'

export type TablesVariables = {
  projectRef?: string
  connectionString?: string
}

export type TablesResponse = Table[] | { error?: any }

export async function getTables(
  { projectRef, connectionString }: TablesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const response = (await get(`${API_URL}/pg-meta/${projectRef}/tables`, {
    headers: Object.fromEntries(headers),
    signal,
  })) as TablesResponse

  if (!Array.isArray(response) && response.error) {
    throw response.error
  }

  return response as PostgresTable[]
}

export type TablesData = Awaited<ReturnType<typeof getTables>>
export type TablesError = unknown

export const useTablesQuery = <TData = TablesData>(
  { projectRef, connectionString }: TablesVariables,
  { enabled = true, ...options }: UseQueryOptions<TablesData, TablesError, TData> = {}
) =>
  useQuery<TablesData, TablesError, TData>(
    tableKeys.list(projectRef),
    ({ signal }) => getTables({ projectRef, connectionString }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
