import { getEventTriggersFallback, getEventTriggersSql } from '@supabase/pg-meta'

import { databaseEventTriggerKeys } from './keys'
import type { EventTrigger } from '@/components/interfaces/Database/Triggers/EventTriggersList/EventTriggerList.utils'
import { grantedQueryOptions, type GrantedQueryCallerOptions } from '@/data/granted-query-options'
import { executeSqlWithCatalogFallback } from '@/data/sql/catalog-fallback-query'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { GrantFor } from '@/lib/grants'

export type DatabaseEventTriggersGrant = GrantFor<'post', '/platform/pg-meta/{ref}/query', 'read'>

export type DatabaseEventTriggersVariables = {
  projectRef?: string
  grant?: DatabaseEventTriggersGrant
  connectionString?: string | null
}

export type DatabaseEventTrigger = {
  oid: number
  name: string
  event: string
  enabled_mode: 'ORIGIN' | 'ALWAYS' | 'REPLICA' | 'DISABLED'
  tags: string[] | null
  function_name: string | null
  function_schema: string | null
  owner: string | null
  function_definition: string | null
}

export async function getDatabaseEventTriggers(
  {
    projectRef,
    connectionString,
    grant,
  }: Omit<DatabaseEventTriggersVariables, 'grant'> & { grant: DatabaseEventTriggersGrant },
  signal?: AbortSignal
) {
  const { result } = await executeSqlWithCatalogFallback<DatabaseEventTrigger[]>(
    {
      projectRef,
      connectionString,
      sqlOrigin: 'studio',
      queryName: 'database-event-triggers',
      sql: getEventTriggersSql(),
      queryKey: databaseEventTriggerKeys.list(projectRef),
      grant,
    },
    (query) => getEventTriggersFallback(query),
    signal
  )

  return result
}

export type DatabaseEventTriggersData = Awaited<ReturnType<typeof getDatabaseEventTriggers>>
export type DatabaseEventTriggersError = StudioError

function markSavedEventTriggerSafe(trigger: DatabaseEventTrigger): EventTrigger {
  return trigger as EventTrigger
}

export const databaseEventTriggersQueryOptions = <TData = EventTrigger[]>(
  { projectRef, connectionString, grant }: DatabaseEventTriggersVariables,
  options?: GrantedQueryCallerOptions<
    EventTrigger[],
    DatabaseEventTriggersError,
    TData,
    ReturnType<typeof databaseEventTriggerKeys.list>
  >
) =>
  grantedQueryOptions(
    {
      queryKey: databaseEventTriggerKeys.list(projectRef),
      queryFn:
        projectRef && grant
          ? ({ signal }) =>
              getDatabaseEventTriggers({ projectRef, connectionString, grant }, signal).then(
                (data) => data.map(markSavedEventTriggerSafe)
              )
          : undefined,
    },
    options
  )
