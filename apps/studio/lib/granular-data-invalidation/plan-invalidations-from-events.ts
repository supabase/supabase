import { databaseKeys } from 'data/database/keys'
import { entityTypeKeys } from 'data/entity-types/keys'
import { tableKeys } from 'data/tables/keys'

import type { InvalidationAction, InvalidationEvent } from '.'

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
