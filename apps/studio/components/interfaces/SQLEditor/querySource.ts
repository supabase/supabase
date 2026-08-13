import { type TimeRange } from '@/data/content/notebooks/notebook-schema'
import type { Snippet } from '@/data/content/sql-folders-query'
import { type QuerySourceId } from '@/data/query-sources/query-source-registry'

/**
 * Domain view of where a snippet's query runs. Derived from the content TYPE:
 * a `log_sql` snippet always targets the logs backend and a `sql` (or `report`)
 * snippet always targets the user's Postgres database. A snippet's source is
 * immutable — switching backends means creating a new snippet, not toggling this
 * value.
 */
export type SqlSnippetSource = QuerySourceId

/**
 * The single reader every surface (AI, reports, tabs, nav, execution) uses to
 * decide where a snippet runs. `'log_sql'` → `'logs'`; everything else (`'sql'`,
 * `'report'`) → `'database'`. Accepts the raw `Snippet['type']` so a snippet of
 * any content type maps to a source without narrowing first.
 */
export function getSnippetSource(snippet: Pick<Snippet, 'type'>): SqlSnippetSource {
  return snippet.type === 'log_sql' ? 'logs' : 'database'
}

export function isLogsSource(source: SqlSnippetSource | undefined): boolean {
  return source === 'logs'
}

/**
 * The markdown fence language a source's SQL is written into a prompt with, so the model
 * can tell a ClickHouse logs query from Postgres SQL.  */
export function sqlSourceToFenceLanguage(
  source: SqlSnippetSource | undefined
): 'sql' | 'clickhouse' {
  return isLogsSource(source) ? 'clickhouse' : 'sql'
}

/**
 * Parse a raw `source` value (e.g. the `?source=` query param a creation entry
 * threads through `/sql/new`) into a `SqlSnippetSource`. Only the explicit
 * `'logs'` opts a new snippet into the logs backend; anything else — including an
 * absent param — is a database snippet, keeping database the safe default.
 */
export function parseSqlSnippetSource(raw: string | undefined): SqlSnippetSource {
  return raw === 'logs' ? 'logs' : 'database'
}

/**
 * Resolve where an open snippet's query runs, falling back to the `?source=` URL param
 * when the snippet isn't in the store yet — a fresh `/sql/new` tab is materialized
 * lazily on the first keystroke, and until then the param is the only signal.
 */
export function resolveSnippetSource(
  snippet: Pick<Snippet, 'type'> | undefined,
  sourceParam: string | undefined
): SqlSnippetSource {
  return snippet !== undefined ? getSnippetSource(snippet) : parseSqlSnippetSource(sourceParam)
}

/**
 * The runtime query source for a snippet, pairing the database/logs discriminant
 * with the extra state each backend needs to run. A logs run carries the active
 * time range (session state, re-resolved at every run); a database run needs
 * nothing beyond the connection the execution pipeline already resolves.
 */
export type QuerySource = { type: 'database' } | { type: 'logs'; dateRange: TimeRange }
