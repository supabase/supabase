import type { Filter, Sort } from './query'

/**
 * Names the question a builder's SQL answers, with the arguments the SQL was built from.
 *
 * Studio sends it next to the SQL. Postgres ignores it and runs the SQL. A backend whose catalogs
 * cannot run pg-meta's SQL yet can answer the same question from its own schema description
 * instead of recognising the SQL text.
 */

type SchemaFilter = {
  includeSystemSchemas?: boolean
  includedSchemas?: string[]
  excludedSchemas?: string[]
  limit?: number
  offset?: number
}

export interface QueryIntentArgs {
  'schemas.list': Pick<SchemaFilter, 'includeSystemSchemas' | 'limit' | 'offset'>
  'tables.list': SchemaFilter & { includeColumns?: boolean }
  'tables.retrieve': { id?: number; name?: string; schema?: string }
  'tables.paginated': {
    schema?: string
    includeColumns?: boolean
    limit: number
    afterOid: number
    nameFilter?: string
  }
  'views.list': SchemaFilter & { includeColumns?: boolean }
  'materialized-views.list': SchemaFilter & { includeColumns?: boolean }
  'foreign-tables.list': SchemaFilter & { includeColumns?: boolean }
  'policies.list': SchemaFilter
  'types.list': SchemaFilter & { includeArrayTypes?: boolean }
  'publications.list': Pick<SchemaFilter, 'limit' | 'offset'>
  'table-privileges.list': SchemaFilter
  'roles.list': { includeDefaultRoles?: boolean; limit?: number; offset?: number }
  'extensions.list': Pick<SchemaFilter, 'limit' | 'offset'>
  'event-triggers.list': Record<string, never>
  'fdws.list': Record<string, never>
  'foreign-keys.list': { schema: string }
  'table-constraints.list': { id: number }
  'indexes.list': { schema: string }
  'default-privileges.state': { schema?: string }
  'entities.list': {
    schemas: string[]
    search?: string
    sort: 'alphabetical' | 'grouped-alphabetical'
    filterTypes: string[]
    excludePartitions?: boolean
    parentId?: number
    limit: number
    page: number
  }
  'entity.definition': { id: number }
  'rows.read': {
    schema: string
    name: string
    filters?: Filter[]
    sorts?: Sort[]
    page?: number
    limit?: number
    maxCharacters?: number
    sortExcludedColumns?: string[]
  }
  'rows.count': { schema: string; name: string; filters?: Filter[] }
  'migrations.list': Record<string, never>
  /** The preflight `explain` of a query sent with `intent`. */
  explain: { intent: QueryIntentId }
}

export type QueryIntentId = Exclude<keyof QueryIntentArgs, 'explain'>

export type QueryIntent = {
  [K in keyof QueryIntentArgs]: { id: K; args: QueryIntentArgs[K] }
}[keyof QueryIntentArgs]

export const queryIntent = <K extends keyof QueryIntentArgs>(
  id: K,
  args: QueryIntentArgs[K]
): QueryIntent => ({ id, args }) as QueryIntent
