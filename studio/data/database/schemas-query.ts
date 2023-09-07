import { PostgresSchema } from '@supabase/postgres-meta'
import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type SchemasVariables = {
  projectRef?: string
  connectionString?: string
}

export type Schema = PostgresSchema

export type SchemasResponse = Schema[] | { error?: any }

export async function getSchemas(
  { projectRef, connectionString }: SchemasVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const response = (await get(`${API_URL}/pg-meta/${projectRef}/schemas`, {
    headers: Object.fromEntries(headers),
    signal,
  })) as SchemasResponse

  if (!Array.isArray(response) && response.error) {
    throw response.error
  }

  return response as PostgresSchema[]
}

export type SchemasData = Awaited<ReturnType<typeof getSchemas>>
export type SchemasError = ResponseError

export const useSchemasQuery = <TData = SchemasData>(
  { projectRef, connectionString }: SchemasVariables,
  { enabled = true, ...options }: UseQueryOptions<SchemasData, SchemasError, TData> = {}
) =>
  useQuery<SchemasData, SchemasError, TData>(
    databaseKeys.schemaList(projectRef),
    ({ signal }) => getSchemas({ projectRef, connectionString }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

export function invalidateSchemasQuery(client: QueryClient, projectRef: string | undefined) {
  return client.invalidateQueries(databaseKeys.schemaList(projectRef))
}
