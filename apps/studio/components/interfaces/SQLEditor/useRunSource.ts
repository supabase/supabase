import { useParams } from 'common'
import { useMemo } from 'react'

import {
  DEFAULT_LOG_DATE_RANGE,
  getSnippetSource,
  parseSqlSnippetSource,
  type QuerySource,
  type SqlSnippetSource,
} from './querySource'
import { useSqlEditorSessionSnapshot } from '@/state/sql-editor/sql-editor-session-state'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor/sql-editor-state'

/**
 * Resolves where a snippet's query runs. A `log_sql` snippet targets the logs
 * backend and carries its session time range (falling back to the default when
 * the user hasn't picked one); every other snippet targets the database. Source
 * is derived from the snippet's content type and is NOT flag-gated here — a
 * URL-opened logs snippet routes correctly even with the feature flag off.
 *
 * Before the snippet exists in the store (a fresh `/sql/new` tab, materialized
 * lazily on the first keystroke) the source falls back to the `?source=` URL
 * param, so a "New logs query" tab shows the logs toolbar and range picker
 * immediately rather than flashing the database controls until the user types.
 */
export function useRunSource(id: string): QuerySource {
  const { source: sourceParam } = useParams()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const sessionSnap = useSqlEditorSessionSnapshot()

  const snippet = snapV2.snippets[id]?.snippet
  const source: SqlSnippetSource =
    snippet !== undefined ? getSnippetSource(snippet) : parseSqlSnippetSource(sourceParam)
  const logRange = sessionSnap.logRange[id]

  return useMemo<QuerySource>(() => {
    if (source === 'logs') {
      return { type: 'logs', dateRange: logRange ?? DEFAULT_LOG_DATE_RANGE }
    }
    return { type: 'database' }
  }, [source, logRange])
}
