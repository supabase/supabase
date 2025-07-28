import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databasePublicationsKeys } from './keys'
import { DEFAULT_PLATFORM_APPLICATION_NAME } from '@supabase/pg-meta/src/constants'

export type DatabasePublicationsVariables = {
  projectRef?: string
  connectionString?: string | null
}

export async function getDatabasePublications(
  { projectRef, connectionString }: DatabasePublicationsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/publications', {
    params: {
      header: {
        'x-connection-encrypted': connectionString!,
        'x-pg-application-name': DEFAULT_PLATFORM_APPLICATION_NAME,
      },
      path: {
        ref: projectRef,
      },
    },
    headers,
    signal,
  })

  if (error) handleError(error)
  return data
}

export type DatabasePublicationsData = Awaited<ReturnType<typeof getDatabasePublications>>
export type DatabasePublicationsError = ResponseError

export const useDatabasePublicationsQuery = <TData = DatabasePublicationsData>(
  { projectRef, connectionString }: DatabasePublicationsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabasePublicationsData, DatabasePublicationsError, TData> = {}
) =>
  useQuery<DatabasePublicationsData, DatabasePublicationsError, TData>(
    databasePublicationsKeys.list(projectRef),
    ({ signal }) => getDatabasePublications({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
