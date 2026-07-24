import type { Snippet } from '@/data/content/sql-folders-query'

/**
 * Domain view of where a snippet's query runs. Derived from the content TYPE:
 * a `log_sql` snippet always targets the logs backend and a `sql` (or `report`)
 * snippet always targets the user's Postgres database. A snippet's source is
 * immutable — switching backends means creating a new snippet, not toggling this
 * value.
 */
export type SqlSnippetSource = 'database' | 'logs'

/**
 * The single reader every surface (AI, reports, tabs, nav, execution) uses to
 * decide where a snippet runs. `'log_sql'` → `'logs'`; everything else (`'sql'`,
 * `'report'`) → `'database'`. Accepts the raw `Snippet['type']` so a snippet of
 * any content type maps to a source without narrowing first.
 */
export function getSnippetSource(snippet: Pick<Snippet, 'type'>): SqlSnippetSource {
  return snippet.type === 'log_sql' ? 'logs' : 'database'
}
