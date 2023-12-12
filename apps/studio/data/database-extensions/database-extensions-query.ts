import { PostgresExtension, PostgresTrigger } from '@supabase/postgres-meta'
import { UseQueryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
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

  const response = (await get(`${API_URL}/pg-meta/${projectRef}/extensions`, {
    headers: Object.fromEntries(headers),
    signal,
  })) as PostgresExtension[] | { error?: any }

  if (!Array.isArray(response) && response.error) throw response.error
  return response as PostgresTrigger[]
}

export type DatabaseExtensionsData = Awaited<ReturnType<typeof getDatabaseExtensions>>
export type DatabaseExtensionsError = ResponseError

export const useDatabaseExtensions = <TData = DatabaseExtensionsData>(
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
      enabled:
        enabled && typeof projectRef !== 'undefined' && typeof connectionString !== 'undefined',
      ...options,
    }
  )

export const useDatabaseExtensionsPrefetch = ({ projectRef }: DatabaseExtensionsVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(databaseExtensionsKeys.list(projectRef), ({ signal }) =>
        getDatabaseExtensions({ projectRef }, signal)
      )
    }
  }, [projectRef])
}
