import { proxy, ref, snapshot, useSnapshot } from 'valtio'

import type { LogDateRange } from '@/components/interfaces/SQLEditor/querySource'

/**
 * Ephemeral, per-session SQL editor state that is NOT persisted: query results,
 * the row limit, and the per-snippet logs time range. Kept separate from the
 * snippet/folder store (which deals with persistence) because none of this is
 * saved — it lives only for the current editing session.
 */
export const sqlEditorSessionState = proxy({
  /**
   * Query results, if any, keyed by snippet id. An array per id as we once
   * experimented with a notebook-style multi-result UI; the shape is kept since
   * a single query with multiple statements can return multiple results.
   */
  results: {} as {
    [snippetId: string]: {
      rows: any[]
      error?: any
      autoLimit?: number
    }[]
  },

  /**
   * UI-imposed limit for the number of rows a query can return (a safeguard
   * against accidentally taking down the database with a huge SELECT). Related
   * to `autoLimit` in `results`; see `applyAutoLimit`.
   */
  limit: 100,

  setLimit: (value: number) => (sqlEditorSessionState.limit = value),

  /**
   * The logs time range for a logs snippet, keyed by snippet id. Session state —
   * never written to snippet content — so it works on read-only shared snippets
   * and resets on reload. An unset snippet has no entry; read sites fall back to
   * `DEFAULT_LOG_DATE_RANGE`.
   */
  logRange: {} as { [snippetId: string]: LogDateRange },

  setLogRange: (id: string, range: LogDateRange) => {
    sqlEditorSessionState.logRange[id] = range
  },

  addResult: (id: string, results: any[], autoLimit?: number) => {
    // Use ref() to prevent Valtio from creating proxies for each row object.
    // This is critical for large result sets - without ref(), Valtio wraps every
    // row and nested property in a Proxy, causing massive memory overhead.
    // Alright to use ref() in this case as the data is meant to be read-only and we
    // don't need to track changes to the underlying data
    sqlEditorSessionState.results[id] = [{ rows: ref(results), autoLimit }]
  },

  addResultError: (id: string, error: any, autoLimit?: number) => {
    sqlEditorSessionState.results[id] = [{ rows: ref([]), error, autoLimit }]
  },

  resetResult: (id: string) => {
    sqlEditorSessionState.results[id] = []
  },

  /** Drop all session state for a snippet (called when the snippet is removed). */
  clearForSnippet: (id: string) => {
    delete sqlEditorSessionState.results[id]
    delete sqlEditorSessionState.logRange[id]
  },
})

export const getSqlEditorSessionSnapshot = () => snapshot(sqlEditorSessionState)

export const useSqlEditorSessionSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(sqlEditorSessionState, options)
