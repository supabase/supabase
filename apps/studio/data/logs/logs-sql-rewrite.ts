import { BASE_PATH } from '@/lib/constants'

export function stripSqlCodeFences(text: string): string {
  const trimmed = text.trim()
  const fenced = trimmed.match(/```(?:sql)?\s*\n?([\s\S]*?)\n?```/i)
  return (fenced ? fenced[1] : trimmed).trim()
}

const SOURCE_ALIASES: Record<string, string> = {
  pg_cron_logs: 'postgres_logs',
}

export function detectLogSource(sql: string): string | undefined {
  // `\b` so only a standalone `source` column counts — an unanchored match reads
  // the value out of `resource = '...'` or `datasource = '...'` too.
  const bySource = sql.match(/\bsource\s*=\s*'([^']+)'/i)
  if (bySource) {
    const source = bySource[1].toLowerCase()
    return SOURCE_ALIASES[source] ?? source
  }
  const byFrom = sql.match(/\bfrom\s+([a-z_][a-z0-9_]*)/i)
  if (byFrom) {
    const table = byFrom[1].toLowerCase()
    if (table === 'logs') return undefined
    return SOURCE_ALIASES[table] ?? table
  }
  return undefined
}

export function looksLikeLegacyLogsQuery(sql: string): boolean {
  const lower = sql.toLowerCase()
  if (/\bunnest\s*\(/.test(lower)) return true
  if (/cast\s*\(\s*timestamp\s+as\s+datetime\s*\)/.test(lower)) return true
  const byFrom = lower.match(/\bfrom\s+([a-z_][a-z0-9_]*)/)
  return byFrom ? byFrom[1] !== 'logs' : false
}

/**
 * How long to let the query text settle before re-running the dialect check.
 * Shared so every surface offering the rewrite reacts on the same cadence.
 */
export const LEGACY_LOGS_DIALECT_CHECK_DEBOUNCE_MS = 500

/**
 * Whether to offer the ClickHouse rewrite for a query. Both the flag and the
 * dialect check matter: on an org whose logs haven't moved to ClickHouse the
 * BigQuery text is still *correct*, so offering to rewrite it would break a
 * working query. Callers layer their own dismissal state on top.
 */
export function shouldOfferLegacyLogsRewrite({
  sql,
  isClickhouseLogsEnabled,
}: {
  sql: string
  isClickhouseLogsEnabled: boolean
}): boolean {
  return isClickhouseLogsEnabled && looksLikeLegacyLogsQuery(sql)
}

export interface RewriteLogsSqlArgs {
  sql: string
  projectRef: string
  connectionString?: string | null
  orgSlug?: string
  authorizationHeader?: string | null
  availableKeys?: string[]
}

/**
 * Asks the completion route to rewrite a whole BigQuery logs query as ClickHouse
 * SQL. The prompt itself lives server-side (`lib/ai/clickhouse-logs.ts`) — this
 * only declares the intent and hands the query over as the selection, the same
 * shape an inline edit uses, so exactly one place knows how a completion prompt
 * is assembled.
 */
export async function rewriteLogsSqlWithAI(args: RewriteLogsSqlArgs) {
  const { sql, projectRef, connectionString, orgSlug, authorizationHeader, availableKeys } = args

  const response = await fetch(`${BASE_PATH}/api/ai/code/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(authorizationHeader ? { Authorization: authorizationHeader } : {}),
    },
    body: JSON.stringify({
      projectRef,
      connectionString,
      language: 'sql',
      dialect: 'clickhouse',
      intent: 'rewrite',
      orgSlug,
      completionMetadata: {
        // The whole query is the selection, so the rewrite replaces all of it and
        // the route supplies the instruction for the `rewrite` intent.
        textBeforeCursor: '',
        textAfterCursor: '',
        prompt: '',
        selection: sql,
        availableKeys,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(errorText || 'Failed to rewrite the query')
  }

  const raw = await response.json()
  const rewritten = stripSqlCodeFences(typeof raw === 'string' ? raw : String(raw))
  if (!rewritten) throw new Error('The assistant returned an empty query')
  return rewritten
}
