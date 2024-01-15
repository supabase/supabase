import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'data/api'
import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type SchemasVariables = {
  projectRef?: string
  connectionString?: string
}

export type Schema = components['schemas']['PostgresSchema']

export async function getSchemas(
  { projectRef, connectionString }: SchemasVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/schemas', {
    params: {
      header: {
        'x-connection-encrypted': connectionString!,
      },
      path: {
        ref: projectRef,
      },
    },
    headers: Object.fromEntries(headers),
    signal,
  })

  if (error) {
    throw error
  }

  return data
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
