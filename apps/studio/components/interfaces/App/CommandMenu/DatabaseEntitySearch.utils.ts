import { SEARCH_ENTITIES_MAX_QUERY_LENGTH } from '@supabase/pg-meta'

import type { EntitySearchTable } from '@/data/database/entity-search-query'

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
