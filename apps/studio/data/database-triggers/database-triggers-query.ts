import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { get, handleError } from 'data/fetchers'
import type { ResponseError } from 'types'
import { databaseTriggerKeys } from './keys'
import { DEFAULT_PLATFORM_APPLICATION_NAME } from '@supabase/pg-meta/src/constants'

export type DatabaseTriggersVariables = {
  projectRef?: string
  connectionString?: string | null
}

export async function getDatabaseTriggers(
  { projectRef, connectionString }: DatabaseTriggersVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const { data, error } = await get('/platform/pg-meta/{ref}/triggers', {
    params: {
      header: {
        'x-connection-encrypted': connectionString!,
        'x-pg-application-name': DEFAULT_PLATFORM_APPLICATION_NAME,
      },
      path: { ref: projectRef },
      query: undefined as any,
    },
    headers,
    signal,
  })

  if (error) handleError(error)
  return data
}

export type DatabaseTriggersData = Awaited<ReturnType<typeof getDatabaseTriggers>>
export type DatabaseTriggersError = ResponseError

export const useDatabaseHooksQuery = <TData = DatabaseTriggersData>(
  { projectRef, connectionString }: DatabaseTriggersVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseTriggersData, DatabaseTriggersError, TData> = {}
) =>
  useQuery<DatabaseTriggersData, DatabaseTriggersError, TData>(
    databaseTriggerKeys.list(projectRef),
    ({ signal }) => getDatabaseTriggers({ projectRef, connectionString }, signal),
    {
      select: (data) => {
        return data.filter((trigger) => {
          return (
            trigger.function_schema === 'supabase_functions' &&
            (trigger.schema !== 'net' || trigger.function_args.length === 0)
          )
        }) as any
      },
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

export const useDatabaseTriggersQuery = <TData = DatabaseTriggersData>(
  { projectRef, connectionString }: DatabaseTriggersVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseTriggersData, DatabaseTriggersError, TData> = {}
) =>
  useQuery<DatabaseTriggersData, DatabaseTriggersError, TData>(
    databaseTriggerKeys.list(projectRef),
    ({ signal }) => getDatabaseTriggers({ projectRef, connectionString }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )
