import { UseQueryOptions, useQuery } from '@tanstack/react-query'
import { get } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseFunctionsKeys } from './keys'
import type { components } from 'data/api'

export type DatabaseFunctionsVariables = {
  projectRef?: string
  connectionString?: string
}

export type DatabaseFunction = components['schemas']['PostgresFunction']

export async function getDatabaseFunctions(
  { projectRef, connectionString }: DatabaseFunctionsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/functions', {
    params: { path: { ref: projectRef } },
    headers,
    signal,
  })

  if (error) throw error
  // [Joshen] API codegen is wrong, its matching Edge functions type to database functions
  return data as unknown as DatabaseFunction[]
}

export type DatabaseFunctionsData = Awaited<ReturnType<typeof getDatabaseFunctions>>
export type DatabaseFunctionsError = ResponseError

export const useDatabaseFunctionsQuery = <TData = DatabaseFunctionsData>(
  { projectRef, connectionString }: DatabaseFunctionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseFunctionsData, DatabaseFunctionsError, TData> = {}
) =>
  useQuery<DatabaseFunctionsData, DatabaseFunctionsError, TData>(
    databaseFunctionsKeys.list(projectRef),
    ({ signal }) => getDatabaseFunctions({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
