import { useQuery } from '@tanstack/react-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useParams } from 'common'
import { executeSql } from 'data/sql/execute-sql-query'

/**
 * Simple test to see all triggers on a table
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
      sql: `
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
        SELECT DISTINCT
          t.trigger_name,
          t.event_object_table as table_name,
          t.event_object_schema as schema_name,
          t.action_statement,
          p.proname as function_name
        FROM information_schema.triggers t
        JOIN table_info ti ON ti.tablename = t.event_object_table
          AND ti.schemaname = t.event_object_schema
        LEFT JOIN pg_proc p ON p.proname = regexp_replace(t.action_statement, '^EXECUTE FUNCTION ', '')
        WHERE t.event_object_table IS NOT NULL
        ORDER BY t.trigger_name;
      `,
    })

    return result.result || []
  } catch (error) {
    console.error('Error debugging triggers:', error)
    return []
  }
}

/**
 * Utility function to test trigger detection
 * Call this in the browser console to debug trigger detection
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
      sql: `
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
        SELECT
          t.trigger_name,
          t.event_object_table as table_name,
          t.event_object_schema as schema_name,
          regexp_replace(t.action_statement, '^EXECUTE FUNCTION ', '') as function_name,
          pg_get_functiondef(p.oid) as function_definition
        FROM information_schema.triggers t
        JOIN table_info ti ON ti.tablename = t.event_object_table
          AND ti.schemaname = t.event_object_schema
        LEFT JOIN pg_proc p ON p.proname = regexp_replace(t.action_statement, '^EXECUTE FUNCTION ', '')
        WHERE t.event_object_table IS NOT NULL
          AND t.action_statement LIKE 'EXECUTE FUNCTION %'
          AND (
            pg_get_functiondef(p.oid) ILIKE '%realtime.send%'
            OR pg_get_functiondef(p.oid) ILIKE '%realtime.broadcast_changes%'
            OR pg_get_functiondef(p.oid) ILIKE '%realtime.broadcast%'
          )
        ORDER BY t.trigger_name;
      `,
    })

    return result.result || []
  } catch (error) {
    console.error('Error debugging triggers:', error)
    return []
  }
}

export interface RealtimeTriggerInfo {
  trigger_name: string
  function_name: string
  function_definition: string
  table_name: string
  schema_name: string
}

/**
 * Query to detect if a table has realtime triggers
 * This checks for triggers that use realtime.send or realtime.broadcast_changes
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
          sql: `
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
            LEFT JOIN pg_proc p ON p.proname = regexp_replace(regexp_replace(t.action_statement, '^EXECUTE FUNCTION ', ''), '[()]', '', 'g')
            WHERE t.event_object_table IS NOT NULL
              AND t.action_statement LIKE 'EXECUTE FUNCTION %'
              AND (
                pg_get_functiondef(p.oid) ILIKE '%realtime.send%'
                OR pg_get_functiondef(p.oid) ILIKE '%realtime.broadcast_changes%'
                OR pg_get_functiondef(p.oid) ILIKE '%realtime.broadcast%'
              )
            ORDER BY t.trigger_name;
          `,
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
 * Hook to determine if a table has realtime enabled
 * Only checks for triggers that use realtime functions
 */
export const useRealtimeStatus = (table: { id?: number; schema: string; name: string }) => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  // Check for realtime triggers
  const { data: realtimeTriggers = [], isLoading: isLoadingTriggers } = useRealtimeTriggersQuery(
    table.id
  )

  // Check if table has realtime triggers
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
