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

/**
 * QueryCacheInvalidator handles smart cache invalidation for database schema changes
 * It parses SQL statements, determines affected entities, and invalidates the appropriate React Query caches
 */
export class QueryCacheInvalidator {
  private queryClient: QueryClient

  constructor(config: InvalidationConfig) {
    this.queryClient = config.queryClient
  }

  /**
   * Parse SQL statement to extract entity information
   */
  private parseSqlStatement(sql: string, projectRef: string): InvalidationEvent | null {
    const sqlLower = sql.toLowerCase().trim()

    // Extract action type
    let action: ActionType | null = null
    if (sqlLower.startsWith('create')) action = 'create'
    else if (sqlLower.startsWith('alter')) action = 'alter'
    else if (sqlLower.startsWith('drop')) action = 'drop'
    else if (sqlLower.includes('enable')) action = 'enable'
    else if (sqlLower.includes('disable')) action = 'disable'

    if (!action) return null

    // Parse entity type and details
    const entityInfo = this.extractEntityInfo(sql, sqlLower, action)
    if (!entityInfo) return null

    const event = {
      ...entityInfo,
      projectRef,
    }

    return event
  }

  private extractEntityInfo(
    sql: string,
    sqlLower: string,
    action: ActionType
  ): Omit<InvalidationEvent, 'projectRef'> | null {
    // Table operations
    if (sqlLower.includes(' table ')) {
      const tableMatch = sql.match(
        /(?:create|alter|drop)\s+table\s+(?:if\s+(?:not\s+)?exists\s+)?(?:"?(\w+)"?\.)?"?(\w+)"?/i
      )
      if (tableMatch) {
        return {
          entityType: 'table',
          action,
          schema: tableMatch[1] || 'public',
          table: tableMatch[2],
          entityName: tableMatch[2],
        }
      }
    }

    // View operations
    if (sqlLower.includes(' view ')) {
      const viewMatch = sql.match(
        /(?:create|alter|drop)\s+(?:materialized\s+)?view\s+(?:if\s+(?:not\s+)?exists\s+)?(?:"?(\w+)"?\.)?"?(\w+)"?/i
      )
      if (viewMatch) {
        const isMaterialized = sqlLower.includes('materialized')
        return {
          entityType: isMaterialized ? 'materialized_view' : 'view',
          action,
          schema: viewMatch[1] || 'public',
          entityName: viewMatch[2],
        }
      }
    }

    // Function/Procedure operations
    if (sqlLower.includes(' function ') || sqlLower.includes(' procedure ')) {
      const funcMatch = sql.match(
        /(?:create|alter|drop)\s+(?:function|procedure)\s+(?:if\s+(?:not\s+)?exists\s+)?(?:"?(\w+)"?\.)?"?(\w+)"?/i
      )
      if (funcMatch) {
        return {
          entityType: sqlLower.includes('function') ? 'function' : 'procedure',
          action,
          schema: funcMatch[1] || 'public',
          entityName: funcMatch[2],
        }
      }
    }

    // Trigger operations
    if (sqlLower.includes(' trigger ')) {
      const triggerMatch = sql.match(
        /(?:create|alter|drop|enable|disable)\s+trigger\s+"?(\w+)"?\s+on\s+(?:"?(\w+)"?\.)?"?(\w+)"?/i
      )
      if (triggerMatch) {
        return {
          entityType: 'trigger',
          action,
          schema: triggerMatch[2] || 'public',
          table: triggerMatch[3],
          entityName: triggerMatch[1],
        }
      }
    }

    // Policy operations (RLS)
    if (sqlLower.includes(' policy ')) {
      const policyMatch = sql.match(
        /(?:create|alter|drop)\s+policy\s+"?(\w+)"?\s+on\s+(?:"?(\w+)"?\.)?"?(\w+)"?/i
      )
      if (policyMatch) {
        return {
          entityType: 'policy',
          action,
          schema: policyMatch[2] || 'public',
          table: policyMatch[3],
          entityName: policyMatch[1],
        }
      }
    }

    // Index operations
    if (sqlLower.includes(' index ')) {
      const indexMatch = sql.match(
        /(?:create|drop)\s+(?:unique\s+)?index\s+(?:concurrently\s+)?(?:if\s+(?:not\s+)?exists\s+)?"?(\w+)"?\s+on\s+(?:"?(\w+)"?\.)?"?(\w+)"?/i
      )
      if (indexMatch) {
        return {
          entityType: 'index',
          action,
          schema: indexMatch[2] || 'public',
          table: indexMatch[3],
          entityName: indexMatch[1],
        }
      }
    }

    // Extension operations
    if (sqlLower.includes(' extension ')) {
      const extMatch = sql.match(
        /(?:create|drop|alter)\s+extension\s+(?:if\s+(?:not\s+)?exists\s+)?"?(\w+)"?/i
      )
      if (extMatch) {
        return {
          entityType: 'extension',
          action,
          entityName: extMatch[1],
        }
      }
    }

    // Enable/Disable RLS
    if (sqlLower.includes('row level security')) {
      const rlsMatch = sql.match(
        /alter\s+table\s+(?:"?(\w+)"?\.)?"?(\w+)"?\s+(?:enable|disable)\s+row\s+level\s+security/i
      )
      if (rlsMatch) {
        return {
          entityType: 'table',
          action: sqlLower.includes('enable') ? 'enable' : 'disable',
          schema: rlsMatch[1] || 'public',
          table: rlsMatch[2],
          entityName: rlsMatch[2],
        }
      }
    }

    return null
  }

  /**
   * Handle invalidation event and update appropriate caches
   */
  private async handleInvalidation(event: InvalidationEvent): Promise<void> {
    // Use setTimeout to ensure this runs in the next event loop
    // after all SQL execution and React updates have completed
    setTimeout(async () => {
      await this.executeInvalidation(event)
    }, 0)
  }

  private async executeInvalidation(event: InvalidationEvent): Promise<void> {
    const { projectRef, entityType, schema, table } = event
    const invalidationPromises: Promise<void>[] = []

    switch (entityType) {
      case 'table':
        const baseTableKey = ['projects', projectRef, 'tables']

        // Use targeted invalidation to minimize refetches
        invalidationPromises.push(
          (async () => {
            // Only invalidate the specific queries we need, not everything
            if (schema) {
              await Promise.all([
                // Target specific table list keys
                this.queryClient.invalidateQueries({
                  queryKey: tableKeys.list(projectRef, schema, true),
                  exact: true,
                }),
                this.queryClient.invalidateQueries({
                  queryKey: tableKeys.list(projectRef, schema, false),
                  exact: true,
                }),
              ])
            } else {
              // If no schema specified, use broader invalidation
              await this.queryClient.invalidateQueries({
                queryKey: baseTableKey,
                exact: false,
              })
            }
          })()
        )
        // Invalidate specific table if provided
        if (table && schema) {
          invalidationPromises.push(
            this.queryClient.invalidateQueries({
              queryKey: tableKeys.retrieve(projectRef, table, schema),
              refetchType: 'active',
            })
          )
        }
        break

      case 'view':
        if (schema) {
          invalidationPromises.push(
            this.queryClient.invalidateQueries({
              queryKey: viewKeys.listBySchema(projectRef, schema),
              refetchType: 'active',
            })
          )
        } else {
          invalidationPromises.push(
            this.queryClient.invalidateQueries({
              queryKey: viewKeys.list(projectRef),
              refetchType: 'active',
            })
          )
        }
        break

      case 'materialized_view':
        if (schema) {
          invalidationPromises.push(
            this.queryClient.invalidateQueries({
              queryKey: materializedViewKeys.listBySchema(projectRef, schema),
              refetchType: 'active',
            })
          )
        } else {
          invalidationPromises.push(
            this.queryClient.invalidateQueries({
              queryKey: materializedViewKeys.list(projectRef),
              refetchType: 'active',
            })
          )
        }
        break

      case 'foreign_table':
        if (schema) {
          invalidationPromises.push(
            this.queryClient.invalidateQueries({
              queryKey: foreignTableKeys.listBySchema(projectRef, schema),
              refetchType: 'active',
            })
          )
        } else {
          invalidationPromises.push(
            this.queryClient.invalidateQueries({
              queryKey: foreignTableKeys.list(projectRef),
              refetchType: 'active',
            })
          )
        }
        break

      case 'policy':
        // Invalidate policies for specific table or all in schema
        if (schema) {
          invalidationPromises.push(
            this.queryClient.invalidateQueries({
              queryKey: databasePoliciesKeys.list(projectRef, schema),
              refetchType: 'active',
            })
          )
        } else {
          invalidationPromises.push(
            this.queryClient.invalidateQueries({
              queryKey: databasePoliciesKeys.list(projectRef),
              refetchType: 'active',
            })
          )
        }
        // Also invalidate table's RLS status
        if (table && schema) {
          invalidationPromises.push(
            this.queryClient.invalidateQueries({
              queryKey: tableKeys.retrieve(projectRef, table, schema),
              refetchType: 'active',
            })
          )
        }
        break

      case 'function':
      case 'procedure':
        invalidationPromises.push(
          this.queryClient.invalidateQueries({
            queryKey: databaseKeys.databaseFunctions(projectRef),
            refetchType: 'active',
          })
        )
        break

      case 'trigger':
        invalidationPromises.push(
          this.queryClient.invalidateQueries({
            queryKey: databaseTriggerKeys.list(projectRef),
            refetchType: 'active',
          })
        )
        // Also invalidate the specific table's triggers
        if (table && schema) {
          invalidationPromises.push(
            this.queryClient.invalidateQueries({
              queryKey: ['projects', projectRef, 'table', `${schema}.${table}`, 'triggers'],
              refetchType: 'active',
            })
          )
        }
        break

      case 'index':
        if (schema) {
          invalidationPromises.push(
            this.queryClient.invalidateQueries({
              queryKey: databaseIndexesKeys.list(projectRef, schema),
              refetchType: 'active',
            })
          )
        } else {
          invalidationPromises.push(
            this.queryClient.invalidateQueries({
              queryKey: databaseIndexesKeys.list(projectRef),
              refetchType: 'active',
            })
          )
        }
        // Also invalidate the specific table's indexes
        if (table && schema) {
          invalidationPromises.push(
            this.queryClient.invalidateQueries({
              queryKey: ['projects', projectRef, 'table', `${schema}.${table}`, 'indexes'],
              refetchType: 'active',
            })
          )
        }
        break

      case 'extension':
        invalidationPromises.push(
          this.queryClient.invalidateQueries({
            queryKey: databaseExtensionsKeys.list(projectRef),
            refetchType: 'active',
          })
        )
        break
    }

    await Promise.all(invalidationPromises)

    // Only invalidate entity types for entity types that show in the Table Editor sidebar
    // This prevents unnecessary API calls for operations that don't affect the sidebar
    const shouldInvalidateEntityTypes = [
      'table',
      'view',
      'materialized_view',
      'foreign_table',
    ].includes(entityType)

    if (shouldInvalidateEntityTypes) {
      await this.queryClient.invalidateQueries({
        queryKey: entityTypeKeys.list(projectRef),
        exact: false,
      })
    }
  }

  /**
   * Process SQL and handle invalidation automatically
   */
  async processSql(sql: string, projectRef: string): Promise<void> {
    const event = this.parseSqlStatement(sql, projectRef)
    if (event) await this.handleInvalidation(event)
  }
}
