import { proxy, ref, snapshot, useSnapshot } from 'valtio'

import type { QueryPlanRow } from '@/components/interfaces/ExplainVisualizer/ExplainVisualizer.types'

/**
 * Ephemeral, per-session SQL editor state that is NOT persisted: query results,
 * EXPLAIN results, and the row limit. Kept separate from the snippet/folder
 * store (which deals with persistence) because none of this is saved — it lives
 * only for the current editing session.
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

  /** EXPLAIN results, if any, keyed by snippet id. */
  explainResults: {} as {
    [snippetId: string]: {
      rows: QueryPlanRow[]
      error?: { message: string; formattedError?: string }
    }
  },

  /**
   * UI-imposed limit for the number of rows a query can return (a safeguard
   * against accidentally taking down the database with a huge SELECT). Related
   * to `autoLimit` in `results`; see `checkIfAppendLimitRequired`/`suffixWithLimit`.
   */
  limit: 100,

  setLimit: (value: number) => (sqlEditorSessionState.limit = value),

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

  addExplainResult: (id: string, results: QueryPlanRow[]) => {
    // Use ref() to prevent Valtio from creating proxies for each row object
    sqlEditorSessionState.explainResults[id] = { rows: ref(results) }
  },

  addExplainResultError: (id: string, error: { message: string; formattedError?: string }) => {
    sqlEditorSessionState.explainResults[id] = { rows: ref([]), error }
  },

  resetExplainResult: (id: string) => {
    sqlEditorSessionState.explainResults[id] = { rows: [] }
  },

  resetResults: (id: string) => {
    sqlEditorSessionState.resetResult(id)
    sqlEditorSessionState.resetExplainResult(id)
  },

  /** Drop all session state for a snippet (called when the snippet is removed). */
  clearForSnippet: (id: string) => {
    delete sqlEditorSessionState.results[id]
    delete sqlEditorSessionState.explainResults[id]
  },
})

export const getSqlEditorSessionSnapshot = () => snapshot(sqlEditorSessionState)

export const useSqlEditorSessionSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(sqlEditorSessionState, options)
