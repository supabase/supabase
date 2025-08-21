import { type QueryClient } from '@tanstack/react-query'

import { parseQuery } from './parse-query'
import { handleInvalidation } from './handle-invalidation'
import { databaseKeys } from '../../data/database/keys'
import { entityTypeKeys } from '../../data/entity-types/keys'
import { tableKeys } from '../../data/tables/keys'

export type EntityType = 'table' | 'function' | 'cron'

export type Event = {
  entityType: EntityType
  schema?: string
  table?: string
  entityName?: string
}

export type InvalidationEvent = Event & {
  projectRef: string
}

export type InvalidationAction = {
  key: readonly unknown[]
  exact?: boolean
  refetchType?: 'active' | 'all' | 'inactive'
}

/**
 * Function to plan invalidations from events
 * Returns what should be invalidated
 */
export function planInvalidationsFromEvents(events: InvalidationEvent[]): InvalidationAction[] {
  const actions: InvalidationAction[] = []

  for (const event of events) {
    const { projectRef, entityType, schema, table } = event

    if (entityType === 'table') {
      if (schema) {
        // Targeted invalidation for specific schema
        actions.push(
          { key: tableKeys.list(projectRef, schema, true), exact: true },
          { key: tableKeys.list(projectRef, schema, false), exact: true }
        )
        // Invalidate specific table if provided
        if (table) {
          actions.push({
            key: tableKeys.retrieve(projectRef, table, schema),
            refetchType: 'active',
          })
        }
      } else {
        // Broader invalidation if no schema specified
        actions.push({
          key: tableKeys.list(projectRef),
          exact: false,
        })
      }
      // Invalidate entity types list for tables
      actions.push({
        key: entityTypeKeys.list(projectRef),
        exact: false,
      })
    } else if (entityType === 'function') {
      actions.push({
        key: databaseKeys.databaseFunctions(projectRef),
        refetchType: 'active',
      })
    } else if (entityType === 'cron') {
      actions.push({
        key: ['projects', projectRef, 'cron-jobs'],
        exact: false,
        refetchType: 'active',
      })
    }
  }

  return actions
}

/**
 * Apply invalidation plan to QueryClient
 */
export async function applyInvalidationPlan(
  queryClient: QueryClient,
  plan: InvalidationAction[]
): Promise<void> {
  const promises = plan.map((action) =>
    queryClient.invalidateQueries({
      queryKey: action.key,
      exact: action.exact,
      refetchType: action.refetchType,
    })
  )

  await Promise.allSettled(promises)
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
    const entityInfos = await parseQuery(sql, sqlLower)

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
