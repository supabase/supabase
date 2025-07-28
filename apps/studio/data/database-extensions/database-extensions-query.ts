import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseExtensionsKeys } from './keys'
import { components } from 'api-types'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from 'lib/constants'
import { DEFAULT_PLATFORM_APPLICATION_NAME } from '@supabase/pg-meta/src/constants'

export type DatabaseExtension = components['schemas']['PostgresExtension']

export type DatabaseExtensionsVariables = {
  projectRef?: string
  connectionString?: string | null
}

export async function getDatabaseExtensions(
  { projectRef, connectionString }: DatabaseExtensionsVariables,
  signal?: AbortSignal,
  headersInit?: HeadersInit
) {
  if (!projectRef) throw new Error('projectRef is required')

  let headers = new Headers(headersInit)
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/extensions', {
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

export type DatabaseExtensionsData = Awaited<ReturnType<typeof getDatabaseExtensions>>
export type DatabaseExtensionsError = ResponseError

export const useDatabaseExtensionsQuery = <TData = DatabaseExtensionsData>(
  { projectRef, connectionString }: DatabaseExtensionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseExtensionsData, DatabaseExtensionsError, TData> = {}
) => {
  const project = useSelectedProject()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<DatabaseExtensionsData, DatabaseExtensionsError, TData>(
    databaseExtensionsKeys.list(projectRef),
    ({ signal }) => getDatabaseExtensions({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && isActive,
      ...options,
    }
  )
}
