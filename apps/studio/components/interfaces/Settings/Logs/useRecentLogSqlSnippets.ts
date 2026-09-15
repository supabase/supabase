import { useMemo } from 'react'

import { untrustedLogSql, type UntrustedLogSqlFragment } from '@/data/logs/safe-analytics-sql'
import { useLocalStorage } from '@/hooks/misc/useLocalStorage'
import type { LogSqlSnippets } from '@/types'

/**
 * Shape of a recent-log-sql entry as it may exist in localStorage. Entries written before the
 * `sql` → `unchecked_sql` rename carry the raw `sql` field; entries written after carry the
 * branded `unchecked_sql`. This tolerant type lets us read both and normalize to the branded
 * frontend shape, so no consumer ever sees an unbranded `sql`.
 */
type StoredRecentLogSqlSnippet = Omit<LogSqlSnippets.Content, 'unchecked_sql'> & {
  unchecked_sql?: UntrustedLogSqlFragment
  sql?: string
}

/**
 * Normalizes a stored recent-log-sql entry into the current `LogSqlSnippets.Content` shape,
 * branding a legacy raw `sql` value with `untrustedLogSql`. Prefers an already-branded
 * `unchecked_sql` when present.
 */
export function normalizeRecentLogSqlSnippet(
  entry: StoredRecentLogSqlSnippet
): LogSqlSnippets.Content {
  const { sql, unchecked_sql, ...rest } = entry
  return { ...rest, unchecked_sql: unchecked_sql ?? untrustedLogSql(sql ?? '') }
}

/**
 * localStorage-backed list of recent Logs Explorer queries, always surfaced with the branded
 * `unchecked_sql` field. Reads tolerate the pre-rename `{ sql }` shape and normalize it; writing
 * the normalized value back heals the stored entries over time.
 */
export function useRecentLogSqlSnippets(projectRef?: string) {
  const [stored, setStored] = useLocalStorage<StoredRecentLogSqlSnippet[]>(
    `project-content-${projectRef}-recent-log-sql`,
    []
  )

  const snippets = useMemo<LogSqlSnippets.Content[]>(
    () => stored.map(normalizeRecentLogSqlSnippet),
    [stored]
  )

  return [snippets, setStored] as const
}
