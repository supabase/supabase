import pgMeta, { type PGTrigger } from '@supabase/pg-meta'
import { useQuery } from '@tanstack/react-query'

import { executeSql } from '../sql/execute-sql-mutation'
import { databaseTriggerKeys } from './keys'
import type { PostgresTrigger } from '@/components/interfaces/Database/Triggers/TriggersList/TriggerList.utils'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

function markSavedTriggerSafe(trigger: DatabaseTriggersData[number]): PostgresTrigger {
  return trigger as PostgresTrigger
}

export type DatabaseTriggersVariables = {
  projectRef?: string
  connectionString?: string | null
  schemas?: string[]
}

export async function getDatabaseTriggers(
  { projectRef, connectionString, schemas }: DatabaseTriggersVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { sql } = pgMeta.triggers.list({ includedSchemas: schemas })
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['triggers'],
    },
    signal
  )

  return result as PGTrigger[]
}

export type DatabaseTriggersData = Awaited<ReturnType<typeof getDatabaseTriggers>>
export type DatabaseTriggersError = ResponseError

export const useDatabaseHooksQuery = <TData = DatabaseTriggersData>(
  { projectRef, connectionString, schemas }: DatabaseTriggersVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<DatabaseTriggersData, DatabaseTriggersError, TData> = {}
) =>
  useQuery<DatabaseTriggersData, DatabaseTriggersError, TData>({
    queryKey: databaseTriggerKeys.list(projectRef, schemas),
    queryFn: ({ signal }) => getDatabaseTriggers({ projectRef, connectionString }, signal),
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
  })

export const useDatabaseTriggersQuery = <TData = PostgresTrigger[]>(
  { projectRef, connectionString }: DatabaseTriggersVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<PostgresTrigger[], DatabaseTriggersError, TData> = {}
) =>
  useQuery<PostgresTrigger[], DatabaseTriggersError, TData>({
    queryKey: databaseTriggerKeys.list(projectRef),
    queryFn: ({ signal }) =>
      getDatabaseTriggers({ projectRef, connectionString }, signal).then((data) =>
        data.map(markSavedTriggerSafe)
      ),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
