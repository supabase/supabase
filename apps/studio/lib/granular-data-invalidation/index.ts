import { type QueryClient } from '@tanstack/react-query'

import { extractEntityInfo } from './extract-entity-info'
import { handleInvalidation } from './handle-invalidation'

export type EntityType = 'table' | 'function' | 'cron'

export type InvalidationEvent = {
  projectRef: string
  entityType: EntityType
  schema?: string
  table?: string
  entityName?: string
}

/**
 * Parse SQL statements and return all invalidation events
 * Uses libpg-query to handle multiple statements in a single call
 */
export async function parseSqlStatements(
  sql: string,
  projectRef: string
): Promise<InvalidationEvent[]> {
  if (!sql || !projectRef) return []

  const sqlLower = sql.toLowerCase().trim()

  // Check if any statement contains supported actions
  const hasValidAction = ['create ', 'drop ', 'cron.schedule', 'cron.unschedule'].some((action) =>
    sqlLower.includes(action)
  )

  if (!hasValidAction) return []

  try {
    const entityInfos = await extractEntityInfo(sql, sqlLower)

    return entityInfos.map((entityInfo) => ({
      ...entityInfo,
      projectRef,
    }))
  } catch (error) {
    console.error('parseSqlStatements: Error parsing SQL', error)
    return []
  }
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
    const events = await parseSqlStatements(sql, projectRef)

    // Fire off all invalidations without blocking
    // Each invalidation runs in its own setTimeout callback
    events.forEach((event) => handleInvalidation(queryClient, event))
  } catch (error) {
    console.error('invalidateCacheGranularly: Error processing SQL', error)
  }
}
