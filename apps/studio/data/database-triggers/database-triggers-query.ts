import pgMeta, { type PGTrigger } from '@supabase/pg-meta'

import { databaseTriggerKeys } from './keys'
import type { PostgresTrigger } from '@/components/interfaces/Database/Triggers/TriggersList/TriggerList.utils'
import { grantedQueryOptions, type GrantedQueryCallerOptions } from '@/data/granted-query-options'
import { executeSql } from '@/data/sql/execute-sql-mutation'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { GrantFor } from '@/lib/grants'

function markSavedTriggerSafe(trigger: DatabaseTriggersData[number]): PostgresTrigger {
  return trigger as PostgresTrigger
}

export type DatabaseTriggersGrant = GrantFor<'post', '/platform/pg-meta/{ref}/query', 'read'>

export type DatabaseTriggersVariables = {
  projectRef?: string
  grant?: DatabaseTriggersGrant
  connectionString?: string | null
  schemas?: string[]
}

export async function getDatabaseTriggers(
  {
    projectRef,
    connectionString,
    schemas,
    grant,
  }: Omit<DatabaseTriggersVariables, 'grant'> & { grant: DatabaseTriggersGrant },
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')

  const { sql } = pgMeta.triggers.list({ includedSchemas: schemas })
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sqlOrigin: 'studio',
      queryName: 'triggers',
      sql,
      queryKey: ['triggers'],
      grant,
    },
    signal
  )

  return result as PGTrigger[]
}

export type DatabaseTriggersData = Awaited<ReturnType<typeof getDatabaseTriggers>>
export type DatabaseTriggersError = StudioError

export const databaseHooksQueryOptions = (
  { projectRef, connectionString, schemas, grant }: DatabaseTriggersVariables,
  options?: GrantedQueryCallerOptions<
    DatabaseTriggersData,
    DatabaseTriggersError,
    DatabaseTriggersData,
    ReturnType<typeof databaseTriggerKeys.list>
  >
) =>
  grantedQueryOptions(
    {
      queryKey: databaseTriggerKeys.list(projectRef, schemas),
      queryFn:
        projectRef && grant
          ? ({ signal }) => getDatabaseTriggers({ projectRef, connectionString, grant }, signal)
          : undefined,
    },
    {
      select: (data): DatabaseTriggersData => {
        return data.filter((trigger) => {
          return (
            trigger.function_schema === 'supabase_functions' &&
            (trigger.schema !== 'net' || trigger.function_args.length === 0)
          )
        })
      },
      ...options,
    }
  )

export const databaseTriggersQueryOptions = <TData = PostgresTrigger[]>(
  { projectRef, connectionString, grant }: DatabaseTriggersVariables,
  options?: GrantedQueryCallerOptions<
    PostgresTrigger[],
    DatabaseTriggersError,
    TData,
    ReturnType<typeof databaseTriggerKeys.list>
  >
) =>
  grantedQueryOptions(
    {
      queryKey: databaseTriggerKeys.list(projectRef),
      queryFn:
        projectRef && grant
          ? ({ signal }) =>
              getDatabaseTriggers({ projectRef, connectionString, grant }, signal).then((data) =>
                data.map(markSavedTriggerSafe)
              )
          : undefined,
    },
    options
  )
