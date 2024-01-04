import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import { ResponseError } from 'types'
import { databaseExtensionsKeys } from './keys'

export type DatabaseExtensionsVariables = {
  projectRef?: string
  connectionString?: string
}

export async function getDatabaseExtensions(
  { projectRef, connectionString }: DatabaseExtensionsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/extensions', {
    params: {
      header: {
        'x-connection-encrypted': connectionString!,
      },
      path: {
        ref: projectRef,
      },
    },
    headers,
    signal,
  })

  if (error) throw error
  return data
}

export type DatabaseExtensionsData = Awaited<ReturnType<typeof getDatabaseExtensions>>
export type DatabaseExtensionsError = ResponseError

export const useDatabaseExtensionsQuery = <TData = DatabaseExtensionsData>(
  { projectRef, connectionString }: DatabaseExtensionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseExtensionsData, DatabaseExtensionsError, TData> = {}
) =>
  useQuery<DatabaseExtensionsData, DatabaseExtensionsError, TData>(
    databaseExtensionsKeys.list(projectRef),
    ({ signal }) => getDatabaseExtensions({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
