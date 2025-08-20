import type { QueryClient } from '@tanstack/react-query'

import type { EntityType, InvalidationEvent } from '.'
import { databaseKeys } from '../../data/database/keys'
import { entityTypeKeys } from '../../data/entity-types/keys'
import { tableKeys } from '../../data/tables/keys'

const ENTITY_TYPES_REQUIRING_LIST_INVALIDATION: EntityType[] = ['table']

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

  await Promise.allSettled(promises)
}

export async function invalidateFunctionQueries(
  queryClient: QueryClient,
  projectRef: string
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: databaseKeys.databaseFunctions(projectRef),
    refetchType: 'active',
  })
}

async function invalidateCronQueries(queryClient: QueryClient, projectRef: string): Promise<void> {
  await queryClient.invalidateQueries({
    // Use generic query key with `exact:false` to invalidate all cron job queries
    // regardless of `searchTerm` (which we can't access from here)
    queryKey: ['projects', projectRef, 'cron-jobs'],
    exact: false,
    refetchType: 'active',
  })
}

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

async function executeInvalidationStrategy(
  queryClient: QueryClient,
  event: InvalidationEvent
): Promise<void> {
  const { projectRef, entityType, schema, table } = event

  const invalidationMap: Record<EntityType, () => Promise<void>> = {
    table: () => invalidateTableQueries(queryClient, projectRef, schema, table),
    function: () => invalidateFunctionQueries(queryClient, projectRef),
    cron: () => invalidateCronQueries(queryClient, projectRef),
  }

  const strategy = invalidationMap[entityType]
  if (strategy) await strategy()
}

async function executeInvalidation(
  queryClient: QueryClient,
  event: InvalidationEvent
): Promise<void> {
  await executeInvalidationStrategy(queryClient, event)

  // Invalidate entity types list for certain entity types
  const { projectRef, entityType } = event
  await invalidateEntityTypesList(queryClient, projectRef, entityType)
}

export function handleInvalidation(queryClient: QueryClient, event: InvalidationEvent) {
  // Execute invalidation asynchronously without blocking the caller
  executeInvalidation(queryClient, event).catch((error) => {
    console.error(`handleInvalidation: Failed to invalidate ${event.entityType}`, error)
  })
}
