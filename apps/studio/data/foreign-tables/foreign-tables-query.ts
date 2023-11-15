import { PostgresTable } from '@supabase/postgres-meta'
import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ForeignTable } from './foreign-table-query'
import { foreignTableKeys } from './keys'

export type ForeignTablesVariables = {
  projectRef?: string
  connectionString?: string
}

export type ForeignTablesResponse = ForeignTable[] | { error?: any }

export async function getForeignTables(
  { projectRef, connectionString }: ForeignTablesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const response = (await get(`${API_URL}/pg-meta/${projectRef}/foreign-tables`, {
    headers: Object.fromEntries(headers),
    signal,
  })) as ForeignTablesResponse

  if (!Array.isArray(response) && response.error) {
    throw response.error
  }

  return response as PostgresTable[]
}

export type ForeignTablesData = Awaited<ReturnType<typeof getForeignTables>>
export type ForeignTablesError = unknown

export const useForeignTablesQuery = <TData = ForeignTablesData>(
  { projectRef, connectionString }: ForeignTablesVariables,
  { enabled = true, ...options }: UseQueryOptions<ForeignTablesData, ForeignTablesError, TData> = {}
) =>
  useQuery<ForeignTablesData, ForeignTablesError, TData>(
    foreignTableKeys.list(projectRef),
    ({ signal }) => getForeignTables({ projectRef, connectionString }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )
