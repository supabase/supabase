import { type QueryClient } from '@tanstack/react-query'
import { tableKeys } from 'data/tables/keys'
import { entityTypeKeys } from 'data/entity-types/keys'
import { databaseKeys } from 'data/database/keys'
import { databaseTriggerKeys } from 'data/database-triggers/keys'

export type EntityType = 'table' | 'function' | 'procedure' | 'trigger'

export type ActionType = 'create' | 'alter' | 'drop' | 'enable' | 'disable'

export type InvalidationEvent = {
  projectRef: string
  entityType: EntityType
  action: ActionType
  schema?: string
  table?: string
  entityName?: string
}

export type InvalidationConfig = {
  queryClient: QueryClient
}

// SQL pattern matchers for different entity types
const SQL_PATTERNS = {
  table:
    /(?:create(?:\s+or\s+replace)?|alter|drop)\s+table\s+(?:if\s+(?:not\s+)?exists\s+)?(?:"?(\w+)"?\.)?"?(\w+)"?/i,
  function:
    /(?:create(?:\s+or\s+replace)?|alter|drop)\s+(?:function|procedure)\s+(?:if\s+(?:not\s+)?exists\s+)?(?:"?(\w+)"?\.)?"?(\w+)"?/i,
  trigger: /trigger\s+"?(\w+)"?(?:[\s\S]*?on\s+(?:(\w+)\.)?(\w+))?/i,
} as const

const DEFAULT_SCHEMA = 'public' as const

// Entity types that require entity list invalidation
const ENTITY_TYPES_REQUIRING_LIST_INVALIDATION: EntityType[] = ['table', 'function']

/**
 * QueryCacheInvalidator handles smart cache invalidation for database schema changes
 * It parses SQL statements, determines affected entities, and invalidates the appropriate React Query caches
 */
export class QueryCacheInvalidator {
  private readonly queryClient: QueryClient

  constructor(config: InvalidationConfig) {
    this.queryClient = config.queryClient
  }

  /**
   * Parse SQL statement to extract entity information
   */
  private parseSqlStatement(sql: string, projectRef: string): InvalidationEvent | null {
    if (!sql || !projectRef) return null

    const sqlLower = sql.toLowerCase().trim()
    const action = this.extractAction(sqlLower)

    if (!action) return null

    const entityInfo = this.extractEntityInfo(sql, sqlLower, action)

    if (!entityInfo) return null

    return {
      ...entityInfo,
      projectRef,
    }
  }

  /**
   * Extract the action type from SQL statement
   */
  private extractAction(sqlLower: string): ActionType | null {
    if (sqlLower.startsWith('create')) return 'create'
    if (sqlLower.startsWith('alter')) return 'alter'
    if (sqlLower.startsWith('drop')) return 'drop'
    if (sqlLower.includes('enable')) return 'enable'
    if (sqlLower.includes('disable')) return 'disable'
    return null
  }

  /**
   * Extract entity information from SQL statement
   */
  private extractEntityInfo(
    sql: string,
    sqlLower: string,
    action: ActionType
  ): Omit<InvalidationEvent, 'projectRef'> | null {
    // Check trigger first since it might contain 'function' in EXECUTE FUNCTION clause
    if (sqlLower.includes(' trigger ')) {
      return this.extractTriggerInfo(sql, action)
    }

    if (sqlLower.includes(' table ')) {
      return this.extractTableInfo(sql, action)
    }

    if (sqlLower.includes(' function ') || sqlLower.includes(' procedure ')) {
      return this.extractFunctionInfo(sql, sqlLower, action)
    }

    return null
  }

  private extractTableInfo(
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

  private extractFunctionInfo(
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

  private extractTriggerInfo(
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
   * Get invalidation strategy for each entity type
   */
  private async executeInvalidationStrategy(event: InvalidationEvent): Promise<void> {
    const { projectRef, entityType, schema, table } = event

    const invalidationMap: Record<EntityType, () => Promise<void>> = {
      table: () => this.invalidateTableQueries(projectRef, schema, table),
      function: () => this.invalidateFunctionQueries(projectRef),
      procedure: () => this.invalidateFunctionQueries(projectRef),
      trigger: () => this.invalidateTriggerQueries(projectRef),
    }

    const strategy = invalidationMap[entityType]
    if (strategy) await strategy()
  }

  /**
   * Handle invalidation event and update appropriate caches
   */
  private async handleInvalidation(event: InvalidationEvent): Promise<void> {
    setTimeout(async () => {
      await this.executeInvalidation(event)
    }, 0)
  }

  private async executeInvalidation(event: InvalidationEvent): Promise<void> {
    // Execute invalidation strategy
    await this.executeInvalidationStrategy(event)

    // Invalidate entity types list for certain entity types
    const { projectRef, entityType } = event
    await this.invalidateEntityTypesList(projectRef, entityType)
  }

  private async invalidateEntityTypesList(
    projectRef: string,
    entityType: EntityType
  ): Promise<void> {
    if (ENTITY_TYPES_REQUIRING_LIST_INVALIDATION.includes(entityType)) {
      await this.queryClient.invalidateQueries({
        queryKey: entityTypeKeys.list(projectRef),
        exact: false,
      })
    }
  }

  private async invalidateTableQueries(
    projectRef: string,
    schema?: string,
    table?: string
  ): Promise<void> {
    const promises: Promise<void>[] = []

    if (schema) {
      // Targeted invalidation for specific schema
      promises.push(
        this.queryClient.invalidateQueries({
          queryKey: tableKeys.list(projectRef, schema, true),
          exact: true,
        }),
        this.queryClient.invalidateQueries({
          queryKey: tableKeys.list(projectRef, schema, false),
          exact: true,
        })
      )
    } else {
      // Broader invalidation if no schema specified
      promises.push(
        this.queryClient.invalidateQueries({
          queryKey: tableKeys.list(projectRef),
          exact: false,
        })
      )
    }

    // Invalidate specific table if provided
    if (table && schema) {
      promises.push(
        this.queryClient.invalidateQueries({
          queryKey: tableKeys.retrieve(projectRef, table, schema),
          refetchType: 'active',
        })
      )
    }

    await Promise.all(promises)
  }

  private async invalidateFunctionQueries(projectRef: string): Promise<void> {
    await this.queryClient.invalidateQueries({
      queryKey: databaseKeys.databaseFunctions(projectRef),
      refetchType: 'active',
    })
  }

  private async invalidateTriggerQueries(projectRef: string): Promise<void> {
    return this.queryClient.invalidateQueries({
      queryKey: databaseTriggerKeys.list(projectRef),
      refetchType: 'active',
    })
  }

  /**
   * Process SQL and handle invalidation automatically
   */
  async processSql(sql: string, projectRef: string): Promise<void> {
    if (!sql || !projectRef) {
      console.warn('QueryCacheInvalidator: Invalid input - SQL and projectRef are required')
      return
    }

    try {
      const event = this.parseSqlStatement(sql, projectRef)
      if (event) {
        await this.handleInvalidation(event)
      }
    } catch (error) {
      console.error('QueryCacheInvalidator: Error processing SQL', error)
    }
  }
}
