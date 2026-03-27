import type { Lint } from 'data/lint/lint-query'

/**
 * Set to false to use live advisor and infra data in the home summary card.
 * When true, the card shows deterministic sample values for demos and local development.
 */
export const HOME_SUPA_AI_SUMMARY_USE_MOCK = true

/** Sample metrics: moderate database load, elevated connections (~84% of limit). */
export const MOCK_HOME_SUMMARY_METRICS = {
  cpu: { current: 47, max: 100 },
  ram: { current: 54, max: 100 },
  disk: { current: 41, max: 100 },
  diskIo: { current: 36, max: 100 },
} as const

export const MOCK_HOME_SUMMARY_CONNECTIONS = { current: 67, max: 80 } as const

/**
 * One security warning and one performance warning with full API-shaped strings
 * so elaboration and the assistant prompt stay realistic.
 */
export const MOCK_HOME_SUMMARY_LINTS: Lint[] = [
  {
    cache_key: 'mock-rls-public',
    categories: ['SECURITY'],
    description:
      'Tables in the public schema are accessible without Row Level Security, so the API does not enforce per-row access rules for those tables.',
    detail:
      'Any client with the anon or service key can read or write rows unless you restrict access in another layer.',
    facing: 'EXTERNAL',
    level: 'WARN',
    metadata: { schema: 'public', name: 'orders', type: 'table' },
    name: 'rls_disabled_in_public',
    remediation:
      'Enable Row Level Security on affected tables and add policies, or move sensitive data to a non-exposed schema.',
    title: 'RLS is disabled on a public table',
  },
  {
    cache_key: 'mock-unindexed-fk',
    categories: ['PERFORMANCE'],
    description:
      'Foreign keys without covering indexes can make deletes and updates on referenced tables slow as related rows grow.',
    detail:
      'Postgres may scan large child tables when the parent key changes if no index exists on the foreign key columns.',
    facing: 'EXTERNAL',
    level: 'WARN',
    metadata: { schema: 'public', name: 'line_items', type: 'table' },
    name: 'unindexed_foreign_keys',
    remediation:
      'Add an index on the foreign key columns that match your query patterns. Review the Advisors detail page for suggested columns.',
    title: 'Unindexed foreign keys',
  },
]

export function getMockHomeSummaryData(): {
  metrics: typeof MOCK_HOME_SUMMARY_METRICS
  connections: typeof MOCK_HOME_SUMMARY_CONNECTIONS
  lints: Lint[]
} {
  return {
    metrics: MOCK_HOME_SUMMARY_METRICS,
    connections: MOCK_HOME_SUMMARY_CONNECTIONS,
    lints: MOCK_HOME_SUMMARY_LINTS,
  }
}
