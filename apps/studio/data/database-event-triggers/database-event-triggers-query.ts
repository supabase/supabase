import { safeSql } from '@supabase/pg-meta/src/pg-format'
import { useQuery } from '@tanstack/react-query'

import { databaseEventTriggerKeys } from './keys'
import type { EventTrigger } from '@/components/interfaces/Database/Triggers/EventTriggersList/EventTriggerList.utils'
import { executeSql } from '@/data/sql/execute-sql-query'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

export type DatabaseEventTriggersVariables = {
  projectRef?: string
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

const EVENT_TRIGGERS_SQL = safeSql`
select
  evt.oid,
  evt.evtname as name,
  evt.evtevent as event,
  case evt.evtenabled
    when 'O' then 'ORIGIN'
    when 'A' then 'ALWAYS'
    when 'R' then 'REPLICA'
    when 'D' then 'DISABLED'
  end as enabled_mode,
  evt.evttags as tags,
  proc.proname as function_name,
  namespace.nspname as function_schema,
  owner.rolname as owner,
  case
    when proc.oid is not null then pg_get_functiondef(proc.oid)
    else null
  end as function_definition
from pg_event_trigger as evt
left join pg_proc as proc on proc.oid = evt.evtfoid
left join pg_namespace as namespace on namespace.oid = proc.pronamespace
left join pg_roles as owner on owner.oid = evt.evtowner
order by evt.evtname;
`

export async function getDatabaseEventTriggers(
  { projectRef, connectionString }: DatabaseEventTriggersVariables,
  signal?: AbortSignal
) {
  const { result } = await executeSql<DatabaseEventTrigger[]>(
    {
      projectRef,
      connectionString,
      sql: EVENT_TRIGGERS_SQL,
      queryKey: databaseEventTriggerKeys.list(projectRef),
    },
    signal
  )

  return result
}

export type DatabaseEventTriggersData = Awaited<ReturnType<typeof getDatabaseEventTriggers>>
export type DatabaseEventTriggersError = ResponseError

function markSavedEventTriggerSafe(trigger: DatabaseEventTrigger): EventTrigger {
  return trigger as EventTrigger
}

export const useDatabaseEventTriggersQuery = <TData = EventTrigger[]>(
  { projectRef, connectionString }: DatabaseEventTriggersVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<EventTrigger[], DatabaseEventTriggersError, TData> = {}
) =>
  useQuery<EventTrigger[], DatabaseEventTriggersError, TData>({
    queryKey: databaseEventTriggerKeys.list(projectRef),
    queryFn: ({ signal }) =>
      getDatabaseEventTriggers({ projectRef, connectionString }, signal).then((data) =>
        data.map(markSavedEventTriggerSafe)
      ),
    enabled: enabled && typeof projectRef !== 'undefined',
    ...options,
  })
