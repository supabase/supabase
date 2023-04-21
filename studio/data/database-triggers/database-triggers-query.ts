import { PostgresTrigger } from '@supabase/postgres-meta'
import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { useCallback } from 'react'
import { databaseTriggerKeys } from './keys'

export type DatabaseTriggersVariables = {
  projectRef?: string
}

export async function getDatabaseTriggers(
  { projectRef }: DatabaseTriggersVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = (await get(`${API_URL}/pg-meta/${projectRef}/triggers`, {
    signal,
  })) as PostgresTrigger[] | { error?: any }

  if (!Array.isArray(response) && response.error) throw response.error
  return response as PostgresTrigger[]
}

export type DatabaseTriggersData = Awaited<ReturnType<typeof getDatabaseTriggers>>
export type DatabaseTriggersError = unknown

export const useDatabaseHooks = <TData = DatabaseTriggersData>(
  { projectRef }: DatabaseTriggersVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseTriggersData, DatabaseTriggersError, TData> = {}
) =>
  useQuery<DatabaseTriggersData, DatabaseTriggersError, TData>(
    databaseTriggerKeys.list(projectRef),
    ({ signal }) => getDatabaseTriggers({ projectRef }, signal),
    {
      // @ts-ignore
      select(data) {
        return (data as PostgresTrigger[]).filter(
          (trigger) => trigger.function_schema === 'supabase_functions' && trigger.schema !== 'net'
        )
      },
      enabled: enabled && typeof projectRef !== 'undefined',
      ...options,
    }
  )

export const useDatabaseTriggers = <TData = DatabaseTriggersData>(
  { projectRef }: DatabaseTriggersVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<DatabaseTriggersData, DatabaseTriggersError, TData> = {}
) =>
  useQuery<DatabaseTriggersData, DatabaseTriggersError, TData>(
    databaseTriggerKeys.list(projectRef),
    ({ signal }) => getDatabaseTriggers({ projectRef }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
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
