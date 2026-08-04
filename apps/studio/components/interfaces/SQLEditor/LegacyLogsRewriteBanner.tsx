import { useDebounce } from '@uidotdev/usehooks'
import { useFlag } from 'common'
import { useMemo } from 'react'

import { DiffType } from './SQLEditor.types'
import { useSqlEditorAssistant, useSqlEditorRun, useSqlEditorSnippet } from './SQLEditorControllers'
import { LegacyLogsRewriteAdmonition } from '@/components/interfaces/Settings/Logs/LegacyLogsRewriteAdmonition'
import {
  LEGACY_LOGS_DIALECT_CHECK_DEBOUNCE_MS,
  shouldOfferLegacyLogsRewrite,
} from '@/data/logs/logs-sql-rewrite'
import { useLegacyLogsRewrite } from '@/hooks/analytics/useLegacyLogsRewrite'
import {
  getSqlEditorV2StateSnapshot,
  useSqlEditorV2StateSnapshot,
} from '@/state/sql-editor/sql-editor-state'

/**
 * Offers to rewrite a logs snippet still written in the old BigQuery dialect
 * (per-service `FROM` tables, `unnest(metadata)` joins) to ClickHouse SQL. Legacy
 * Logs Explorer saved queries open in the SQL editor as `log_sql` snippets, and
 * those queries error against the ClickHouse-backed endpoint the editor runs them
 * on — this is the in-editor path out.
 *
 * The request itself is `useLegacyLogsRewrite` (shared with the Logs Explorer);
 * this decides when to offer it and routes the result into the editor's existing
 * AI diff view, so the user accepts or discards it the same way as any other AI
 * edit rather than having the snippet rewritten under them.
 *
 * Mount with `key={id}` so the offer resets when the user switches snippets. This
 * component must NOT be conditionally mounted by its parent — it hides itself, so
 * that opening a diff doesn't unmount it and throw away a dismissal.
 */
export const LegacyLogsRewriteBanner = () => {
  const { id } = useSqlEditorSnippet()
  const { runSource } = useSqlEditorRun()
  const {
    diff: { isDiffOpen, setSourceSqlDiff, setSelectedDiffType },
  } = useSqlEditorAssistant()

  const isOtelLogsEnabled = useFlag('otelLegacyLogs')
  const snapV2 = useSqlEditorV2StateSnapshot()

  // The store is written on every keystroke, so debounce before running the
  // dialect heuristics — the banner's visibility doesn't need per-character
  // precision, and a settled value avoids flapping mid-edit.
  const liveSql = snapV2.snippets[id]?.snippet.content?.unchecked_sql ?? ''
  const settledSql = useDebounce(liveSql, LEGACY_LOGS_DIALECT_CHECK_DEBOUNCE_MS)

  const isLogsSnippetNeedingRewrite = useMemo(
    () =>
      runSource.type === 'logs' &&
      shouldOfferLegacyLogsRewrite({ sql: settledSql, isClickhouseLogsEnabled: isOtelLogsEnabled }),
    [runSource.type, settledSql, isOtelLogsEnabled]
  )

  const { state, requestRewrite, dismiss } = useLegacyLogsRewrite({
    // Rewrite exactly what's in the editor now, not the debounced value the
    // visibility check used — they differ if the user clicked mid-edit.
    readSql: () => getSqlEditorV2StateSnapshot().snippets[id]?.snippet.content?.unchecked_sql ?? '',
    onProposal: ({ original, modified }) => {
      setSourceSqlDiff({ original, modified })
      setSelectedDiffType(DiffType.Modification)
    },
  })

  // An outcome the user hasn't acknowledged stays up even once the query no longer
  // looks legacy — otherwise a successful proposal would yank its own result away.
  const hasUnacknowledgedOutcome = state.status === 'failed' || state.status === 'noRewriteNeeded'
  const canShowBanner = !isDiffOpen && (isLogsSnippetNeedingRewrite || hasUnacknowledgedOutcome)

  if (!canShowBanner) return null

  return (
    <LegacyLogsRewriteAdmonition state={state} onRewrite={requestRewrite} onDismiss={dismiss} />
  )
}
