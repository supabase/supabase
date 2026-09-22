import { proxy, useSnapshot } from 'valtio'

import { DiffType } from '@/components/interfaces/SQLEditor/SQLEditor.types'

/**
 * A one-shot request to render a SQL diff in the active SQL editor.
 *
 * Unlike the session store (per-snippet results that many components read
 * repeatedly), this is a transient command: it is produced outside the editor
 * — e.g. the Assistant's "Insert code" / "Replace code" actions — and consumed
 * exactly once by the editor. It targets whichever editor is active, not a
 * particular snippet. It is drained on consumption rather than stored, so a
 * stale request can never leak into a later editor or editing session.
 */
export const sqlEditorDiffRequestState = proxy({
  pending: undefined as undefined | { sql: string; diffType: DiffType },

  /** Queue a diff to be applied to the active editor. */
  requestDiff: (sql: string, diffType: DiffType) => {
    sqlEditorDiffRequestState.pending = { sql, diffType }
  },

  /** Read and clear the pending request, returning it (or undefined if none). */
  consumeDiffRequest: () => {
    const request = sqlEditorDiffRequestState.pending
    sqlEditorDiffRequestState.pending = undefined
    return request
  },
})

export const useSqlEditorDiffRequestSnapshot = (options?: Parameters<typeof useSnapshot>[1]) =>
  useSnapshot(sqlEditorDiffRequestState, options)
