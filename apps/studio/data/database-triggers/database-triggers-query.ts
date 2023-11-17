import { PostgresTrigger } from '@supabase/postgres-meta'
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { databaseTriggerKeys } from './keys'
import { ResponseError } from 'types'

export type DatabaseTriggersVariables = {
  projectRef?: string
  connectionString?: string
}

export async function getDatabaseTriggers(
  { projectRef, connectionString }: DatabaseTriggersVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  let headers = new Headers()
  if (connectionString) headers.set('x-connection-encrypted', connectionString)

  const response = (await get(`${API_URL}/pg-meta/${projectRef}/triggers`, {
    headers: Object.fromEntries(headers),
    signal,
  })) as PostgresTrigger[] | { error?: any }

  if (!Array.isArray(response) && response.error) throw response.error
  return response as PostgresTrigger[]
}

export type DatabaseTriggersData = Awaited<ReturnType<typeof getDatabaseTriggers>>
export type DatabaseTriggersError = ResponseError

export const useDatabaseHooks = <TData = DatabaseTriggersData>(
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
      // @ts-ignore
      select(data) {
        return (data as PostgresTrigger[]).filter(
          (trigger) =>
            trigger.function_schema === 'supabase_functions' &&
            (trigger.schema !== 'net' || trigger.function_args.length === 0)
        )
      },
      enabled:
        enabled && typeof projectRef !== 'undefined' && typeof connectionString !== 'undefined',
      ...options,
    }
  )

export const useDatabaseTriggers = <TData = DatabaseTriggersData>(
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
      enabled:
        enabled && typeof projectRef !== 'undefined' && typeof connectionString !== 'undefined',
      ...options,
    }
  )

export const useDatabaseTriggersPrefetch = ({ projectRef }: DatabaseTriggersVariables) => {
  const client = useQueryClient()

  return useCallback(() => {
    if (projectRef) {
      client.prefetchQuery(databaseTriggerKeys.list(projectRef), ({ signal }) =>
        getDatabaseTriggers({ projectRef }, signal)
      )
    }
  }, [projectRef])
}
