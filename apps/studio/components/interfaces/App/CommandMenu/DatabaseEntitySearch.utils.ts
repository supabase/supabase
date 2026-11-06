import { SEARCH_ENTITIES_MAX_QUERY_LENGTH } from '@supabase/pg-meta'

import type {
  EntitySearchFunction,
  EntitySearchPolicy,
  EntitySearchTable,
  EntitySearchTrigger,
} from '@/data/database/entity-search-query'

// Each search runs SQL against the user's database, so keep it to queries that
// are specific enough to be useful: short queries match too broadly to be worth
// the round-trip.
export const ENTITY_SEARCH_MIN_QUERY_LENGTH = 3
export const ENTITY_SEARCH_DEBOUNCE_MS = 300

export function getEntitySearchQuery(query: string) {
  const trimmed = query.trim()
  const isSearchable =
    trimmed.length >= ENTITY_SEARCH_MIN_QUERY_LENGTH &&
    trimmed.length <= SEARCH_ENTITIES_MAX_QUERY_LENGTH
  return { query: trimmed, isSearchable }
}

/**
 * Client-side mirror of the matching in getSearchEntitiesSql: the name contains
 * the query, or for `schema.name` queries, the schema starts with the part
 * before the first dot and the name contains the part after it. Used to narrow
 * results from a previous search while the current one is still in flight.
 */
export function matchesEntitySearch(
  { schema, name }: Pick<EntitySearchTable, 'schema' | 'name'>,
  query: string
) {
  const lowerQuery = query.toLowerCase()
  const lowerName = name.toLowerCase()
  if (lowerName.includes(lowerQuery)) return true

  const dotIndex = lowerQuery.indexOf('.')
  if (dotIndex === -1) return false

  const schemaPart = lowerQuery.slice(0, dotIndex)
  const namePart = lowerQuery.slice(dotIndex + 1)
  return schema.toLowerCase().startsWith(schemaPart) && lowerName.includes(namePart)
}

/**
 * Client-side mirror of how policies and triggers are matched in
 * getSearchEntitiesSql: the entity's own name contains the query, or its table
 * matches it. Used to narrow results from a previous search while the current
 * one is still in flight.
 */
export function matchesTableRelatedSearch(
  { name, schema, table }: Pick<EntitySearchPolicy, 'name' | 'schema' | 'table'>,
  query: string
) {
  if (name.toLowerCase().includes(query.toLowerCase())) return true
  return matchesEntitySearch({ schema, name: table }, query)
}

export function formatTableSearchDetails({
  policy_count,
  rls_enabled,
}: Pick<EntitySearchTable, 'policy_count' | 'rls_enabled'>) {
  const policies = `${policy_count} ${policy_count === 1 ? 'policy' : 'policies'}`
  return `${policies} • RLS ${rls_enabled ? 'enabled' : 'disabled'}`
}

export function getTableEditorRoute(
  projectRef: string,
  table: Pick<EntitySearchTable, 'id' | 'schema'>
): `/${string}` {
  return `/project/${projectRef}/editor/${table.id}?schema=${encodeURIComponent(table.schema)}`
}

// The policies page lists policies per schema, so the schema must be set for
// the policy to be found and opened for editing.
export function getPolicyEditorRoute(
  projectRef: string,
  policy: Pick<EntitySearchPolicy, 'id' | 'schema'>
): `/${string}` {
  return `/project/${projectRef}/database/policies?schema=${encodeURIComponent(policy.schema)}&edit=${policy.id}`
}

// Triggers found through their function don't match by name or table, so say which
// function they run instead of their timing
export function formatTriggerSearchDetails({
  activation,
  events,
  schema,
  table,
  matched_function,
}: Pick<EntitySearchTrigger, 'activation' | 'events' | 'schema' | 'table' | 'matched_function'>) {
  if (matched_function) return `Runs ${matched_function}`
  return `${activation} ${events.join(' OR ')} on ${schema}.${table}`
}

/**
 * Client-side mirror of how triggers are matched in getSearchEntitiesSql: like
 * policies, by name or table, plus triggers found through the function they run.
 */
export function matchesTriggerSearch(
  trigger: Pick<EntitySearchTrigger, 'name' | 'schema' | 'table' | 'matched_function'>,
  query: string
) {
  if (matchesTableRelatedSearch(trigger, query)) return true
  return trigger.matched_function?.toLowerCase().includes(query.toLowerCase()) ?? false
}

// The triggers page lists triggers per schema (of their table), so the schema
// must be set for the trigger to be found and opened for editing. The index
// route only redirects, and drops the query string, so link to the list directly.
export function getTriggerEditorRoute(
  projectRef: string,
  trigger: Pick<EntitySearchTrigger, 'id' | 'schema'>
): `/${string}` {
  return `/project/${projectRef}/database/triggers/data?schema=${encodeURIComponent(trigger.schema)}&edit=${trigger.id}`
}

export function formatFunctionSearchDetails({
  type,
  args,
}: Pick<EntitySearchFunction, 'type' | 'args'>) {
  const procedure = type === 'procedure' ? 'procedure' : ''
  if (args.length === 0) return procedure
  return `${procedure} (${args})`.trim()
}

// The functions page lists functions per schema, so the schema must be set for
// the function to be found and opened for editing.
export function getFunctionEditorRoute(
  projectRef: string,
  fn: Pick<EntitySearchFunction, 'id' | 'schema'>
): `/${string}` {
  return `/project/${projectRef}/database/functions?schema=${encodeURIComponent(fn.schema)}&edit=${fn.id}`
}
