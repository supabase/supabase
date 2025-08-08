import { type QueryClient } from '@tanstack/react-query'
import { tableKeys } from 'data/tables/keys'
import { viewKeys } from 'data/views/keys'
import { materializedViewKeys } from 'data/materialized-views/keys'
import { foreignTableKeys } from 'data/foreign-tables/keys'
import { databasePoliciesKeys } from 'data/database-policies/keys'
import { databaseKeys } from 'data/database/keys'
import { databaseTriggerKeys } from 'data/database-triggers/keys'
import { databaseIndexesKeys } from 'data/database-indexes/keys'
import { databaseExtensionsKeys } from 'data/database-extensions/keys'
import { entityTypeKeys } from 'data/entity-types/keys'

export type EntityType =
  | 'table'
  | 'view'
  | 'materialized_view'
  | 'foreign_table'
  | 'function'
  | 'procedure'
  | 'trigger'
  | 'policy'
  | 'index'
  | 'extension'

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
  table: /(?:create|alter|drop)\s+table\s+(?:if\s+(?:not\s+)?exists\s+)?(?:"?(\w+)"?\.)?"?(\w+)"?/i,
  view: /(?:create|alter|drop)\s+(?:materialized\s+)?view\s+(?:if\s+(?:not\s+)?exists\s+)?(?:"?(\w+)"?\.)?"?(\w+)"?/i,
  function:
    /(?:create|alter|drop)\s+(?:function|procedure)\s+(?:if\s+(?:not\s+)?exists\s+)?(?:"?(\w+)"?\.)?"?(\w+)"?/i,
  trigger:
    /(?:create|alter|drop|enable|disable)\s+trigger\s+"?(\w+)"?\s+on\s+(?:"?(\w+)"?\.)?"?(\w+)"?/i,
  policy: /(?:create|alter|drop)\s+policy\s+"?(\w+)"?\s+on\s+(?:"?(\w+)"?\.)?"?(\w+)"?/i,
  index:
    /(?:create|drop)\s+(?:unique\s+)?index\s+(?:concurrently\s+)?(?:if\s+(?:not\s+)?exists\s+)?"?(\w+)"?\s+on\s+(?:"?(\w+)"?\.)?"?(\w+)"?/i,
  extension: /(?:create|drop|alter)\s+extension\s+(?:if\s+(?:not\s+)?exists\s+)?"?(\w+)"?/i,
  rls: /alter\s+table\s+(?:"?(\w+)"?\.)?"?(\w+)"?\s+(?:enable|disable)\s+row\s+level\s+security/i,
} as const

const DEFAULT_SCHEMA = 'public' as const

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
    // Check for RLS operations first (special case)
    if (sqlLower.includes('row level security')) {
      return this.extractRlsInfo(sql, sqlLower)
    }

    // Check each entity type
    if (sqlLower.includes(' table ')) {
      return this.extractTableInfo(sql, action)
    }

    if (sqlLower.includes(' view ')) {
      return this.extractViewInfo(sql, sqlLower, action)
    }

    if (sqlLower.includes(' function ') || sqlLower.includes(' procedure ')) {
      return this.extractFunctionInfo(sql, sqlLower, action)
    }

    if (sqlLower.includes(' trigger ')) {
      return this.extractTriggerInfo(sql, action)
    }

    if (sqlLower.includes(' policy ')) {
      return this.extractPolicyInfo(sql, action)
    }

    if (sqlLower.includes(' index ')) {
      return this.extractIndexInfo(sql, action)
    }

    if (sqlLower.includes(' extension ')) {
      return this.extractExtensionInfo(sql, action)
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

  private extractViewInfo(
    sql: string,
    sqlLower: string,
    action: ActionType
  ): Omit<InvalidationEvent, 'projectRef'> | null {
    const match = sql.match(SQL_PATTERNS.view)
    if (!match) return null

    const isMaterialized = sqlLower.includes('materialized')
    return {
      entityType: isMaterialized ? 'materialized_view' : 'view',
      action,
      schema: match[1] || DEFAULT_SCHEMA,
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

    return {
      entityType: 'trigger',
      action,
      schema: match[2] || DEFAULT_SCHEMA,
      table: match[3],
      entityName: match[1],
    }
  }

  private extractPolicyInfo(
    sql: string,
    action: ActionType
  ): Omit<InvalidationEvent, 'projectRef'> | null {
    const match = sql.match(SQL_PATTERNS.policy)
    if (!match) return null

    return {
      entityType: 'policy',
      action,
      schema: match[2] || DEFAULT_SCHEMA,
      table: match[3],
      entityName: match[1],
    }
  }

  private extractIndexInfo(
    sql: string,
    action: ActionType
  ): Omit<InvalidationEvent, 'projectRef'> | null {
    const match = sql.match(SQL_PATTERNS.index)
    if (!match) return null

    return {
      entityType: 'index',
      action,
      schema: match[2] || DEFAULT_SCHEMA,
      table: match[3],
      entityName: match[1],
    }
  }

  private extractExtensionInfo(
    sql: string,
    action: ActionType
  ): Omit<InvalidationEvent, 'projectRef'> | null {
    const match = sql.match(SQL_PATTERNS.extension)
    if (!match) return null

    return {
      entityType: 'extension',
      action,
      entityName: match[1],
    }
  }

  private extractRlsInfo(
    sql: string,
    sqlLower: string
  ): Omit<InvalidationEvent, 'projectRef'> | null {
    const match = sql.match(SQL_PATTERNS.rls)
    if (!match) return null

    return {
      entityType: 'table',
      action: sqlLower.includes('enable') ? 'enable' : 'disable',
      schema: match[1] || DEFAULT_SCHEMA,
      table: match[2],
      entityName: match[2],
    }
  }

  /**
   * Get invalidation strategy for each entity type
   */
  private async executeInvalidationStrategy(event: InvalidationEvent): Promise<void> {
    const { projectRef, entityType, schema, table } = event

    const invalidationMap: Record<EntityType, () => Promise<void>> = {
      table: () => this.invalidateTableQueries(projectRef, schema, table),
      view: () => this.invalidateViewQueries(projectRef, schema),
      materialized_view: () => this.invalidateMaterializedViewQueries(projectRef, schema),
      foreign_table: () => this.invalidateForeignTableQueries(projectRef, schema),
      policy: () => this.invalidatePolicyQueries(projectRef, schema, table),
      function: () => this.invalidateFunctionQueries(projectRef),
      procedure: () => this.invalidateFunctionQueries(projectRef),
      trigger: () => this.invalidateTriggerQueries(projectRef, schema, table),
      index: () => this.invalidateIndexQueries(projectRef, schema, table),
      extension: () => this.invalidateExtensionQueries(projectRef),
    }

    const strategy = invalidationMap[entityType]
    if (strategy) await strategy()
  }

  /**
   * Handle invalidation event and update appropriate caches
   */
  private async handleInvalidation(event: InvalidationEvent): Promise<void> {
    setTimeout(async () => {
      console.log('start: handleInvalidation')
      await this.executeInvalidation(event)
      console.log('end: handleInvalidation')
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
    // Entity types that require entity list invalidation
    const entityTypesRequiringListInvalidation: EntityType[] = [
      'table',
      'view',
      'materialized_view',
      'foreign_table',
    ]

    if (entityTypesRequiringListInvalidation.includes(entityType)) {
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
          queryKey: ['projects', projectRef, 'tables'],
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

  private async invalidateViewQueries(projectRef: string, schema?: string): Promise<void> {
    const queryKey = schema ? viewKeys.listBySchema(projectRef, schema) : viewKeys.list(projectRef)

    await this.queryClient.invalidateQueries({
      queryKey,
      refetchType: 'active',
    })
  }

  private async invalidateMaterializedViewQueries(
    projectRef: string,
    schema?: string
  ): Promise<void> {
    const queryKey = schema
      ? materializedViewKeys.listBySchema(projectRef, schema)
      : materializedViewKeys.list(projectRef)

    await this.queryClient.invalidateQueries({
      queryKey,
      refetchType: 'active',
    })
  }

  private async invalidateForeignTableQueries(projectRef: string, schema?: string): Promise<void> {
    const queryKey = schema
      ? foreignTableKeys.listBySchema(projectRef, schema)
      : foreignTableKeys.list(projectRef)

    await this.queryClient.invalidateQueries({
      queryKey,
      refetchType: 'active',
    })
  }

  private async invalidatePolicyQueries(
    projectRef: string,
    schema?: string,
    table?: string
  ): Promise<void> {
    const promises: Promise<void>[] = []

    // Invalidate policies
    const queryKey = schema
      ? databasePoliciesKeys.list(projectRef, schema)
      : databasePoliciesKeys.list(projectRef)

    promises.push(
      this.queryClient.invalidateQueries({
        queryKey,
        refetchType: 'active',
      })
    )

    // Also invalidate table's RLS status
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

  private async invalidateTriggerQueries(
    projectRef: string,
    schema?: string,
    table?: string
  ): Promise<void> {
    const promises: Promise<void>[] = [
      this.queryClient.invalidateQueries({
        queryKey: databaseTriggerKeys.list(projectRef),
        refetchType: 'active',
      }),
    ]

    // Also invalidate the specific table's triggers
    if (table && schema) {
      promises.push(
        this.queryClient.invalidateQueries({
          queryKey: ['projects', projectRef, 'table', `${schema}.${table}`, 'triggers'],
          refetchType: 'active',
        })
      )
    }

    await Promise.all(promises)
  }

  private async invalidateIndexQueries(
    projectRef: string,
    schema?: string,
    table?: string
  ): Promise<void> {
    const promises: Promise<void>[] = []

    const queryKey = schema
      ? databaseIndexesKeys.list(projectRef, schema)
      : databaseIndexesKeys.list(projectRef)

    promises.push(
      this.queryClient.invalidateQueries({
        queryKey,
        refetchType: 'active',
      })
    )

    // Also invalidate the specific table's indexes
    if (table && schema) {
      promises.push(
        this.queryClient.invalidateQueries({
          queryKey: ['projects', projectRef, 'table', `${schema}.${table}`, 'indexes'],
          refetchType: 'active',
        })
      )
    }

    await Promise.all(promises)
  }

  private async invalidateExtensionQueries(projectRef: string): Promise<void> {
    await this.queryClient.invalidateQueries({
      queryKey: databaseExtensionsKeys.list(projectRef),
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
