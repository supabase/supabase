import { type QueryClient } from '@tanstack/react-query'
import { tableKeys } from 'data/tables/keys'
import { entityTypeKeys } from 'data/entity-types/keys'
import { databaseKeys } from 'data/database/keys'
import { databaseTriggerKeys } from 'data/database-triggers/keys'
import { databasePoliciesKeys } from 'data/database-policies/keys'

const DEFAULT_SCHEMA = 'public' as const

export type EntityType = 'table' | 'function' | 'procedure' | 'trigger' | 'policy'

export type ActionType = 'create' | 'alter' | 'drop' | 'enable' | 'disable'

export type InvalidationEvent = {
  projectRef: string
  entityType: EntityType
  action: ActionType
  schema?: string
  table?: string
  entityName?: string
}

// SQL pattern matchers for different entity types
const SQL_PATTERNS = {
  table: /table\s+(?:if\s+(?:not\s+)?exists\s+)?"?(?:(\w+)\.)?"?(\w+)"?/i,
  function: /(?:function|procedure)\s+(?:if\s+(?:not\s+)?exists\s+)?"?(?:(\w+)\.)?"?(\w+)"?/i,
  trigger: /trigger\s+"?(\w+)"?(?:[\s\S]*?on\s+"?(?:(\w+)\.)?"?(\w+)"?)?/i,
  policy: /policy\s+(?:"([^"]+)"|(\w+))\s+on\s+(?:"?(\w+)"?\.)??"?(\w+)"?/i,
} as const

// Entity types that require entity list invalidation
const ENTITY_TYPES_REQUIRING_LIST_INVALIDATION: EntityType[] = ['table', 'function']

/**
 * Extract the action type from SQL statement
 */
function extractAction(sqlLower: string): ActionType | null {
  if (sqlLower.startsWith('create')) return 'create'
  if (sqlLower.startsWith('alter')) return 'alter'
  if (sqlLower.startsWith('drop')) return 'drop'
  if (sqlLower.includes('enable')) return 'enable'
  if (sqlLower.includes('disable')) return 'disable'
  return null
}

/**
 * Extract table information from SQL statement
 */
function extractTableInfo(
  sql: string,
  action: ActionType
): Omit<InvalidationEvent, 'projectRef'> | null {
  const match = sql.match(SQL_PATTERNS.table)
  if (!match) return null

  return {
    entityType: 'table',
    action,
    schema: match[1] || DEFAULT_SCHEMA,
    table: match[2],
    entityName: match[2],
  }
}

/**
 * Extract function/procedure information from SQL statement
 */
function extractFunctionInfo(
  sql: string,
  sqlLower: string,
  action: ActionType
): Omit<InvalidationEvent, 'projectRef'> | null {
  const match = sql.match(SQL_PATTERNS.function)
  if (!match) return null

  return {
    entityType: sqlLower.includes('function') ? 'function' : 'procedure',
    action,
    schema: match[1] || DEFAULT_SCHEMA,
    entityName: match[2],
  }
}

/**
 * Extract trigger information from SQL statement
 */
function extractTriggerInfo(
  sql: string,
  action: ActionType
): Omit<InvalidationEvent, 'projectRef'> | null {
  const match = sql.match(SQL_PATTERNS.trigger)
  if (!match) return null

  // match[1] is the trigger name
  // match[2] is schema (optional)
  // match[3] is table name
  const schema = match[2] || DEFAULT_SCHEMA
  const table = match[3]

  return {
    entityType: 'trigger',
    action,
    schema,
    table,
    entityName: match[1],
  }
}

/**
 * Extract policy information from SQL statement
 */
function extractPolicyInfo(
  sql: string,
  action: ActionType
): Omit<InvalidationEvent, 'projectRef'> | null {
  const match = sql.match(SQL_PATTERNS.policy)
  if (!match) return null

  return {
    entityType: 'policy',
    action,
    schema: match[3] || DEFAULT_SCHEMA,
    table: match[4],
    entityName: match[1] || match[2], // match[1] for quoted names, match[2] for unquoted
  }
}

/**
 * Extract entity information from SQL statement
 */
function extractEntityInfo(
  sql: string,
  sqlLower: string,
  action: ActionType
): Omit<InvalidationEvent, 'projectRef'> | null {
  // Check trigger first since it might contain 'function' in EXECUTE FUNCTION clause
  if (sqlLower.includes(' trigger ')) {
    return extractTriggerInfo(sql, action)
  }

  if (sqlLower.includes(' table ')) {
    return extractTableInfo(sql, action)
  }

  if (sqlLower.includes(' function ') || sqlLower.includes(' procedure ')) {
    return extractFunctionInfo(sql, sqlLower, action)
  }

  if (sqlLower.includes(' policy ')) {
    return extractPolicyInfo(sql, action)
  }

  return null
}

export function parseSqlStatement(sql: string, projectRef: string): InvalidationEvent | null {
  if (!sql || !projectRef) return null

  const sqlLower = sql.toLowerCase().trim()
  const action = extractAction(sqlLower)

  if (!action) return null

  const entityInfo = extractEntityInfo(sql, sqlLower, action)

  if (!entityInfo) return null

  return {
    ...entityInfo,
    projectRef,
  }
}

/**
 * Invalidate table-related queries
 */
export async function invalidateTableQueries(
  queryClient: QueryClient,
  projectRef: string,
  schema?: string,
  table?: string
): Promise<void> {
  const promises: Promise<void>[] = []

  if (schema) {
    // Targeted invalidation for specific schema
    promises.push(
      queryClient.invalidateQueries({
        queryKey: tableKeys.list(projectRef, schema, true),
        exact: true,
      }),
      queryClient.invalidateQueries({
        queryKey: tableKeys.list(projectRef, schema, false),
        exact: true,
      })
    )
  } else {
    // Broader invalidation if no schema specified
    promises.push(
      queryClient.invalidateQueries({
        queryKey: tableKeys.list(projectRef),
        exact: false,
      })
    )
  }

  // Invalidate specific table if provided
  if (table && schema) {
    promises.push(
      queryClient.invalidateQueries({
        queryKey: tableKeys.retrieve(projectRef, table, schema),
        refetchType: 'active',
      })
    )
  }

  await Promise.all(promises)
}

/**
 * Invalidate function/procedure queries
 */
export async function invalidateFunctionQueries(
  queryClient: QueryClient,
  projectRef: string
): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: databaseKeys.databaseFunctions(projectRef),
    refetchType: 'active',
  })
}

/**
 * Invalidate trigger queries
 */
export async function invalidateTriggerQueries(
  queryClient: QueryClient,
  projectRef: string
): Promise<void> {
  return queryClient.invalidateQueries({
    queryKey: databaseTriggerKeys.list(projectRef),
    refetchType: 'active',
  })
}

/**
 * Invalidate policy queries
 */
export async function invalidatePolicyQueries(
  queryClient: QueryClient,
  projectRef: string,
  schema?: string,
  table?: string
): Promise<void> {
  const promises: Promise<void>[] = []

  promises.push(
    queryClient.invalidateQueries({
      queryKey: databasePoliciesKeys.list(projectRef),
      refetchType: 'active',
    })
  )

  // Also invalidate table's RLS status
  if (table && schema) {
    promises.push(
      queryClient.invalidateQueries({
        queryKey: tableKeys.retrieve(projectRef, table, schema),
        refetchType: 'active',
      })
    )
  }

  await Promise.all(promises)
}

/**
 * Invalidate entity types list for certain entity types
 */
async function invalidateEntityTypesList(
  queryClient: QueryClient,
  projectRef: string,
  entityType: EntityType
): Promise<void> {
  if (ENTITY_TYPES_REQUIRING_LIST_INVALIDATION.includes(entityType)) {
    await queryClient.invalidateQueries({
      queryKey: entityTypeKeys.list(projectRef),
      exact: false,
    })
  }
}

/**
 * Execute invalidation strategy for each entity type
 */
async function executeInvalidationStrategy(
  queryClient: QueryClient,
  event: InvalidationEvent
): Promise<void> {
  const { projectRef, entityType, schema, table } = event

  const invalidationMap: Record<EntityType, () => Promise<void>> = {
    table: () => invalidateTableQueries(queryClient, projectRef, schema, table),
    function: () => invalidateFunctionQueries(queryClient, projectRef),
    procedure: () => invalidateFunctionQueries(queryClient, projectRef),
    trigger: () => invalidateTriggerQueries(queryClient, projectRef),
    policy: () => invalidatePolicyQueries(queryClient, projectRef, schema, table),
  }

  const strategy = invalidationMap[entityType]
  if (strategy) await strategy()
}

/**
 * Execute invalidation for an event
 */
async function executeInvalidation(
  queryClient: QueryClient,
  event: InvalidationEvent
): Promise<void> {
  // Execute invalidation strategy
  await executeInvalidationStrategy(queryClient, event)

  // Invalidate entity types list for certain entity types
  const { projectRef, entityType } = event
  await invalidateEntityTypesList(queryClient, projectRef, entityType)
}

/**
 * Handle invalidation event and update appropriate caches
 */
async function handleInvalidation(
  queryClient: QueryClient,
  event: InvalidationEvent
): Promise<void> {
  setTimeout(async () => {
    await executeInvalidation(queryClient, event)
  }, 0)
}

/**
 * Process SQL and handle invalidation automatically
 * This is the main entry point for processing SQL statements
 */
export async function invalidateCacheGranularly(
  queryClient: QueryClient,
  sql: string,
  projectRef: string
): Promise<void> {
  if (!sql || !projectRef) {
    console.warn('invalidateCacheGranularly: Invalid input - SQL and projectRef are required')
    return
  }

  try {
    const event = parseSqlStatement(sql, projectRef)
    if (event) {
      await handleInvalidation(queryClient, event)
    }
  } catch (error) {
    console.error('invalidateCacheGranularly: Error processing SQL', error)
  }
}
