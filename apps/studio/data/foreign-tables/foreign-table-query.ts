import { PostgresTable } from '@supabase/postgres-meta'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { foreignTableKeys } from './keys'

export type ForeignTableVariables = {
  id?: number
  projectRef?: string
  connectionString?: string
}

export type ForeignTable = PostgresTable

export type ForeignTableResponse = ForeignTable | { error?: any }

export async function getForeignTable(
  { id, projectRef, connectionString }: ForeignTableVariables,
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

  const response = (await get(`${API_URL}/pg-meta/${projectRef}/foreign-tables?id=${id}`, {
    headers: Object.fromEntries(headers),
    signal,
  })) as ForeignTableResponse

  if ('error' in response) {
    throw response.error
  }

  return response as PostgresTable
}

export type ForeignTableData = Awaited<ReturnType<typeof getForeignTable>>
export type ForeignTableError = unknown

export const useForeignTableQuery = <TData = ForeignTableData>(
  { projectRef, connectionString, id }: ForeignTableVariables,
  { enabled = true, ...options }: UseQueryOptions<ForeignTableData, ForeignTableError, TData> = {}
) =>
  useQuery<ForeignTableData, ForeignTableError, TData>(
    foreignTableKeys.foreignTable(projectRef, id),
    ({ signal }) => getForeignTable({ projectRef, connectionString, id }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined',
      ...options,
    }
  )
