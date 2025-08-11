import { type QueryClient } from '@tanstack/react-query'

import { extractEntityInfo } from './extract-entity-info'
import { handleInvalidation } from './handle-invalidation'

export type EntityType = 'table' | 'function' | 'procedure' | 'trigger' | 'policy' | 'index'

export type ActionType = 'create' | 'alter' | 'drop' | 'enable' | 'disable'

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
  if (sqlLower.startsWith('alter')) return 'alter'
  if (sqlLower.startsWith('drop')) return 'drop'
  if (sqlLower.includes('enable')) return 'enable'
  if (sqlLower.includes('disable')) return 'disable'
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
