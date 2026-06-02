import type { Snippet } from '@/data/content/sql-folders-query'

export function isLogsSnippet(snippet?: { type?: string; content?: unknown } | null) {
  if (!snippet) return false

  if (snippet.type === 'log_sql') return true

  const content = snippet.content
  if (content && typeof content === 'object' && 'query_source' in content) {
    return (content as { query_source?: string }).query_source === 'logs'
  }

  return false
}

export function getSnippetQuerySource(
  snippet?: { type?: string; content?: unknown } | null
): 'database' | 'logs' {
  return isLogsSnippet(snippet) ? 'logs' : 'database'
}

export function getSnippetSqlFromContent(content: unknown): string {
  if (!content || typeof content !== 'object') return ''

  if ('unchecked_sql' in content && typeof content.unchecked_sql === 'string') {
    return content.unchecked_sql
  }

  if ('sql' in content && typeof content.sql === 'string') {
    return content.sql
  }

  return ''
}

export function getSnippetContentType(snippet?: { type?: string; content?: unknown } | null) {
  return isLogsSnippet(snippet) ? 'log_sql' : 'sql'
}

export function buildSnippetUpsertContent(
  id: string,
  type: 'sql' | 'log_sql',
  content: unknown
): Record<string, unknown> {
  const sqlValue = getSnippetSqlFromContent(content)

  if (type === 'log_sql') {
    return {
      content_id: id,
      schema_version:
        content && typeof content === 'object' && 'schema_version' in content
          ? (content as { schema_version: string }).schema_version
          : '1.0',
      sql: sqlValue,
    }
  }

  const base =
    content && typeof content === 'object' ? { ...(content as Record<string, unknown>) } : {}

  return {
    ...base,
    content_id: id,
    query_source: 'database',
  }
}

export function mergeSnippetsWithLogSql<T extends Snippet>(
  snippets: T[],
  logSqlSnippets: Snippet[]
): T[] {
  if (logSqlSnippets.length === 0) return snippets

  const existingIds = new Set(snippets.map((snippet) => snippet.id))
  const additional = logSqlSnippets.filter((snippet) => !existingIds.has(snippet.id))

  return [...snippets, ...(additional as T[])]
}
