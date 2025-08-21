import { type QueryClient } from '@tanstack/react-query'

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
 * Process SQL and handle invalidation automatically
 * This is the main entry point for processing SQL statements
 */
export async function invalidateDataGranularly(
  queryClient: QueryClient,
  sql: string,
  projectRef: string
): Promise<void> {
  if (!sql || !projectRef) {
    console.warn('invalidateDataGranularly: Invalid input - SQL and projectRef are required')
    return
  }

  try {
    const events = await parseSqlStatements(sql, projectRef)
    const plan = planInvalidationsFromEvents(events)
    await applyInvalidationPlan(queryClient, plan)
  } catch (error) {
    console.error('invalidateDataGranularly: Error processing SQL', error)
  }
}
