import { QueryClient, useQuery, UseQueryOptions } from '@tanstack/react-query'

import { components } from 'data/api'
import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { databaseKeys } from './keys'

export type TypesVariables = {
  projectRef?: string
  connectionString?: string
}

export type PostgresType = components['schemas']['PostgresType']

export async function getTypes(
  { projectRef, connectionString }: TypesVariables,
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

  if (error) {
    throw error
  }

  return data
}

export type TypesData = Awaited<ReturnType<typeof getTypes>>
export type TypesError = ResponseError

export const useTypesQuery = <TData = TypesData>(
  { projectRef, connectionString }: TypesVariables,
  { enabled = true, ...options }: UseQueryOptions<TypesData, TypesError, TData> = {}
) =>
  useQuery<TypesData, TypesError, TData>(
    databaseKeys.schemaList(projectRef),
    ({ signal }) => getTypes({ projectRef, connectionString }, signal),
    { enabled: enabled && typeof projectRef !== 'undefined', ...options }
  )

export function invalidateTypesQuery(client: QueryClient, projectRef: string | undefined) {
  return client.invalidateQueries(databaseKeys.schemaList(projectRef))
}
