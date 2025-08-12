import type { QueryClient } from '@tanstack/react-query'

import type { EntityType, InvalidationEvent } from './invalidate-cache-granularly'
import { databasePoliciesKeys } from 'data/database-policies/keys'
import { databaseTriggerKeys } from 'data/database-triggers/keys'
import { databaseKeys } from 'data/database/keys'
import { entityTypeKeys } from 'data/entity-types/keys'
import { tableKeys } from 'data/tables/keys'
import { databaseIndexesKeys } from 'data/database-indexes/keys'

// Entity types that require entity list invalidation
const ENTITY_TYPES_REQUIRING_LIST_INVALIDATION: EntityType[] = ['table', 'function']

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

export async function invalidateFunctionQueries(
  queryClient: QueryClient,
  projectRef: string
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: databaseKeys.databaseFunctions(projectRef),
    refetchType: 'active',
  })
}

export async function invalidateTriggerQueries(
  queryClient: QueryClient,
  projectRef: string
): Promise<void> {
  await queryClient.invalidateQueries({
    queryKey: databaseTriggerKeys.list(projectRef),
    refetchType: 'active',
  })
}

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

  // Also invalidate table's RLS status if active
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

async function invalidateIndexQueries(
  queryClient: QueryClient,
  projectRef: string,
  schema?: string,
  table?: string
): Promise<void> {
  const promises: Promise<void>[] = []

  const queryKey = schema
    ? databaseIndexesKeys.list(projectRef, schema)
    : databaseIndexesKeys.list(projectRef)

  promises.push(
    queryClient.invalidateQueries({
      queryKey,
      refetchType: 'active',
    })
  )

  // Also invalidate the specific table's indexes if active
  if (table && schema) {
    promises.push(
      queryClient.invalidateQueries({
        queryKey: ['projects', projectRef, 'table', `${schema}.${table}`, 'indexes'],
        refetchType: 'active',
      })
    )
  }

  await Promise.all(promises)
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
    procedure: () => invalidateFunctionQueries(queryClient, projectRef),
    trigger: () => invalidateTriggerQueries(queryClient, projectRef),
    policy: () => invalidatePolicyQueries(queryClient, projectRef, schema, table),
    index: () => invalidateIndexQueries(queryClient, projectRef, schema, table),
    cron: () => invalidateCronQueries(queryClient, projectRef),
  }

  const strategy = invalidationMap[entityType]
  if (strategy) await strategy()
}

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
export async function handleInvalidation(
  queryClient: QueryClient,
  event: InvalidationEvent
): Promise<void> {
  setTimeout(async () => {
    await executeInvalidation(queryClient, event)
  }, 0)
}
