import { useDebounce } from '@uidotdev/usehooks'
import { useFlag } from 'common'
import { useMemo } from 'react'

import { LegacyLogsRewriteAdmonition } from '@/components/interfaces/Settings/Logs/LegacyLogsRewriteAdmonition'
import {
  LEGACY_LOGS_DIALECT_CHECK_DEBOUNCE_MS,
  shouldOfferLegacyLogsRewrite,
} from '@/data/logs/logs-sql-rewrite'
import { useLegacyLogsRewrite } from '@/hooks/analytics/useLegacyLogsRewrite'

type LegacyLogsRewriteBannerProps = {
  isLogsSource: boolean
  sql: string
  readSql: () => string
  onSqlChange: (sql: string) => void
  onSqlCommit?: (sql: string) => void
}

/**
 * Offers to rewrite a logs query still written in the old BigQuery dialect
 * (per-service `FROM` tables, `unnest(metadata)` joins) to ClickHouse SQL.
 *
 * The SQL editor's equivalent routes an accepted rewrite into its AI diff view;
 * Explorer's `QueryEditor` has no diff view, so this swaps the SQL in place via
 * `onSqlChange`/`onSqlCommit` — the same pair `handleRunQuery` already uses to
 * commit the editor's buffer.
 */
export const LegacyLogsRewriteBanner = ({
  isLogsSource,
  sql,
  readSql,
  onSqlChange,
  onSqlCommit,
}: LegacyLogsRewriteBannerProps) => {
  const isOtelLogsEnabled = useFlag('otelLegacyLogs')

  // The buffer updates on every keystroke, so debounce before running the
  // dialect heuristics — the banner's visibility doesn't need per-character
  // precision, and a settled value avoids flapping mid-edit.
  const settledSql = useDebounce(sql, LEGACY_LOGS_DIALECT_CHECK_DEBOUNCE_MS)

  const needsRewrite = useMemo(
    () =>
      isLogsSource &&
      shouldOfferLegacyLogsRewrite({ sql: settledSql, isClickhouseLogsEnabled: isOtelLogsEnabled }),
    [isLogsSource, settledSql, isOtelLogsEnabled]
  )

  const { state, requestRewrite, dismiss } = useLegacyLogsRewrite({
    readSql,
    onProposal: ({ modified }) => {
      onSqlChange(modified)
      onSqlCommit?.(modified)
    },
  })

  // An outcome the user hasn't acknowledged stays up even once the query no longer
  // looks legacy — otherwise a successful proposal would yank its own result away.
  const hasUnacknowledgedOutcome = state.status === 'failed' || state.status === 'noRewriteNeeded'
  if (!(needsRewrite || hasUnacknowledgedOutcome)) return null

  return <LegacyLogsRewriteAdmonition state={state} onRewrite={requestRewrite} onDismiss={dismiss} />
}
