import { type QueryClient } from '@tanstack/react-query'

import { extractEntityInfo } from './extract-entity-info'
import { handleInvalidation } from './handle-invalidation'

export type EntityType = 'table' | 'function' | 'cron'

export type ActionType = 'create' | 'drop'

export type InvalidationEvent = {
  projectRef: string
  entityType: EntityType
  schema?: string
  table?: string
  entityName?: string
}

/**
 * Extract the action type from SQL statement
 */
function extractAction(sqlLower: string): ActionType | null {
  if (sqlLower.startsWith('create')) return 'create'
  if (sqlLower.startsWith('drop')) return 'drop'

  // Special handling for cron operations (uses SELECT statements)
  if (sqlLower.includes('cron.schedule')) return 'create'
  if (sqlLower.includes('cron.unschedule')) return 'drop'

  return null
}

export function parseSqlStatement(sql: string, projectRef: string): InvalidationEvent | null {
  if (!sql || !projectRef) return null

  const sqlLower = sql.toLowerCase().trim()
  const action = extractAction(sqlLower)

  if (!action) return null

  const entityInfo = extractEntityInfo(sql, sqlLower)

  if (!entityInfo) return null

  return {
    ...entityInfo,
    projectRef,
  }
}

/**
 * Parse multiple SQL statements and return all invalidation events
 */
export function parseSqlStatements(sql: string, projectRef: string): InvalidationEvent[] {
  if (!sql || !projectRef) return []

  // Split by semicolon but keep semicolons for proper parsing
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => s + ';')

  const events: InvalidationEvent[] = []

  for (const statement of statements) {
    const event = parseSqlStatement(statement, projectRef)
    if (event) {
      events.push(event)
    }
  }

  return events
}

/**
 * Process SQL and handle invalidation automatically
 * This is the main entry point for processing SQL statements
 */
export async function invalidateDataGranularly(
  queryClient: QueryClient,
  sql: string,
  projectRef: string
): Promise<void> {
  if (!sql || !projectRef) {
    console.warn('invalidateCacheGranularly: Invalid input - SQL and projectRef are required')
    return
  }

  try {
    const events = parseSqlStatements(sql, projectRef)

    // Fire off all invalidations without blocking
    // Each invalidation runs in its own setTimeout callback
    events.forEach((event) => handleInvalidation(queryClient, event))
  } catch (error) {
    console.error('invalidateCacheGranularly: Error processing SQL', error)
  }
}
