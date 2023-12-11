import { PostgresType } from '@supabase/postgres-meta'
import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'

import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type PostgresTypesVariables = {
  projectRef?: string
  connectionString?: string
}

export async function getPostgresTypes(
  { projectRef, connectionString }: PostgresTypesVariables,
  signal?: AbortSignal
) {
  if (!projectRef) {
    throw new Error('projectRef is required')
  }

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/types', {
    // @ts-ignore [Joshen] query param is not required
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

  if (error) throw error
  return data as PostgresType[]
}

export type PostgresTypesData = Awaited<ReturnType<typeof getPostgresTypes>>
export type PostgresTypesError = ResponseError

export const usePostgresTypesQuery = <TData = PostgresTypesData>(
  { projectRef, connectionString }: PostgresTypesVariables,
  { enabled = true, ...options }: UseQueryOptions<PostgresTypesData, PostgresTypesError, TData> = {}
) =>
  useQuery<PostgresTypesData, PostgresTypesError, TData>(
    databaseKeys.postgresTypes(projectRef),
    ({ signal }) => getPostgresTypes({ projectRef, connectionString }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

export function invalidatePostgresTypesQuery(client: QueryClient, projectRef: string | undefined) {
  return client.invalidateQueries(databaseKeys.postgresTypes(projectRef))
}
