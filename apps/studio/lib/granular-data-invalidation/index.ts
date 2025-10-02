import { parseSqlStatements } from './parse-sql-statements'
import { planInvalidationsFromEvents } from './plan-invalidations-from-events'

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
 * Process SQL and handle invalidation automatically
 * This is the main entry point for processing SQL statements
 */
export async function invalidateDataGranularly(
  sql: string,
  projectRef: string
): Promise<InvalidationAction[]> {
  if (!sql || !projectRef) {
    console.warn('invalidateDataGranularly: Invalid input - SQL and projectRef are required')
    return []
  }

  try {
    const events = await parseSqlStatements(sql, projectRef)
    const plan = planInvalidationsFromEvents(events)
    return plan
  } catch (error) {
    console.error('invalidateDataGranularly: Error processing SQL', error)
    return []
  }
}
