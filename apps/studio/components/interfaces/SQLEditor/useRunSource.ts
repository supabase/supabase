import { useMemo } from 'react'

import { DEFAULT_LOG_DATE_RANGE, type QuerySource } from './querySource'
import { useSqlEditorSessionSnapshot } from '@/state/sql-editor/sql-editor-session-state'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor/sql-editor-state'

/**
 * Resolves where a snippet's query runs. A `log_sql` snippet targets the logs
 * backend and carries its session time range (falling back to the default when
 * the user hasn't picked one); every other snippet targets the database. Source
 * is derived from the snippet's content type and is NOT flag-gated here — a
 * URL-opened logs snippet routes correctly even with the feature flag off.
 */
export function useRunSource(id: string): QuerySource {
  const snapV2 = useSqlEditorV2StateSnapshot()
  const sessionSnap = useSqlEditorSessionSnapshot()

  const snippetType = snapV2.snippets[id]?.snippet.type
  const logRange = sessionSnap.logRange[id]

  return useMemo<QuerySource>(() => {
    if (snippetType === 'log_sql') {
      return { type: 'logs', dateRange: logRange ?? DEFAULT_LOG_DATE_RANGE }
    }
    return { type: 'database' }
  }, [snippetType, logRange])
}
