import { useQuery } from '@tanstack/react-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useParams } from 'common'
import { executeSql } from 'data/sql/execute-sql-query'

export interface RealtimeTriggerInfo {
  trigger_name: string
  function_name: string
  function_definition: string
  table_name: string
  schema_name: string
}

/**
 * Common SQL query to get table information by ID
 */
const getTableInfoQuery = (tableId: number) => `
  WITH table_info AS (
    SELECT
      nc.nspname as schemaname,
      c.relname as tablename,
      c.oid::regclass::text as table_full_name
    FROM pg_class c
    JOIN pg_namespace nc ON nc.oid = c.relnamespace
    WHERE c.oid = ${tableId}
      AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
  )
`

/**
 * Common SQL query to get triggers for a table
 */
const getTriggersQuery = (includeRealtimeFilter = false) => `
  SELECT DISTINCT
    t.trigger_name,
    t.event_object_table as table_name,
    t.event_object_schema as schema_name,
    t.action_statement,
    regexp_replace(t.action_statement, '^EXECUTE FUNCTION ', '') as function_name,
    pg_get_functiondef(p.oid) as function_definition
  FROM information_schema.triggers t
  JOIN table_info ti ON ti.tablename = t.event_object_table
    AND ti.schemaname = t.event_object_schema
  LEFT JOIN pg_proc p ON p.proname = regexp_replace(
    regexp_replace(t.action_statement, '^EXECUTE FUNCTION ', ''),
    '[()]', '', 'g'
  )
  WHERE t.event_object_table IS NOT NULL
    AND t.action_statement LIKE 'EXECUTE FUNCTION %'
    ${
      includeRealtimeFilter
        ? `
      AND (
        pg_get_functiondef(p.oid) ILIKE '%realtime.send%'
        OR pg_get_functiondef(p.oid) ILIKE '%realtime.broadcast_changes%'
        OR pg_get_functiondef(p.oid) ILIKE '%realtime.broadcast%'
      )
    `
        : ''
    }
  ORDER BY t.trigger_name
`

/**
 * Debug utility to see all triggers on a table
 */
export const debugAllTriggers = async (
  tableId: number,
  projectRef: string,
  connectionString: string
) => {
  try {
    const result = await executeSql({
      projectRef,
      connectionString,
      sql: `${getTableInfoQuery(tableId)}${getTriggersQuery(false)};`,
    })
    return result.result || []
  } catch (error) {
    console.error('Error debugging triggers:', error)
    return []
  }
}

/**
 * Debug utility to test realtime trigger detection
 */
export const debugRealtimeTriggers = async (
  tableId: number,
  projectRef: string,
  connectionString: string
) => {
  try {
    const result = await executeSql({
      projectRef,
      connectionString,
      sql: `${getTableInfoQuery(tableId)}${getTriggersQuery(true)};`,
    })
    return result.result || []
  } catch (error) {
    console.error('Error debugging realtime triggers:', error)
    return []
  }
}

/**
 * Query to detect if a table has realtime triggers
 * Checks for triggers that use realtime.send, realtime.broadcast_changes, or realtime.broadcast
 */
export const useRealtimeTriggersQuery = (tableId?: number) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  return useQuery({
    queryKey: ['realtime-triggers', projectRef, tableId],
    queryFn: async (): Promise<RealtimeTriggerInfo[]> => {
      if (!project?.connectionString || !tableId) {
        return []
      }

      try {
        const result = await executeSql({
          projectRef: projectRef!,
          connectionString: project.connectionString,
          sql: `${getTableInfoQuery(tableId)}${getTriggersQuery(true)};`,
        })
        return result.result || []
      } catch (error) {
        console.error('Error fetching realtime triggers:', error)
        return []
      }
    },
    enabled: !!project?.connectionString && !!tableId,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false,
  })
}

/**
 * Hook to determine if a table has realtime enabled via triggers
 * Only checks for triggers that use realtime functions
 */
export const useRealtimeStatus = (table: { id?: number; schema: string; name: string }) => {
  const { data: realtimeTriggers = [], isLoading: isLoadingTriggers } = useRealtimeTriggersQuery(
    table.id
  )

  const hasTriggerRealtime = realtimeTriggers.some((trigger) => {
    const tableSchema = table.schema || 'public'
    const triggerSchema = trigger.schema_name || 'public'
    return trigger.table_name === table.name && triggerSchema === tableSchema
  })

  return {
    isRealtimeEnabled: hasTriggerRealtime,
    hasTriggerRealtime,
    realtimeTriggers,
    isLoading: isLoadingTriggers,
    realtimeType: hasTriggerRealtime ? 'trigger' : 'none',
  }
}
