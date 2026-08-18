import { useDebounce } from '@uidotdev/usehooks'
import { useFlag } from 'common'
import { useMemo } from 'react'

import { LegacyLogsRewriteAdmonition } from './LegacyLogsRewriteAdmonition'
import {
  LEGACY_LOGS_DIALECT_CHECK_DEBOUNCE_MS,
  shouldOfferLegacyLogsRewrite,
} from '@/data/logs/logs-sql-rewrite'
import {
  useLegacyLogsRewrite,
  type LegacyLogsRewriteProposal,
} from '@/hooks/analytics/useLegacyLogsRewrite'

export type LegacyLogsRewriteBannerProps = {
  isLogsSource: boolean
  sql: string
  readSql: () => string
  onProposal: (proposal: LegacyLogsRewriteProposal) => void
  /** An extra hide condition layered on top of the offer's own visibility, for a
   *  surface that has its own reason to suppress it (the SQL editor while a diff
   *  is open). */
  hidden?: boolean
}

/**
 * Offers to rewrite a logs query still written in the old BigQuery dialect
 * (per-service `FROM` tables, `unnest(metadata)` joins) to ClickHouse SQL.
 * Shared by every surface that can run a logs query and wants to offer this —
 * each one decides how to source `sql`/`readSql` and what an accepted
 * `onProposal` does with the result (the SQL editor opens a diff, Explorer's
 * query editor swaps the buffer directly).
 */
export const LegacyLogsRewriteBanner = ({
  isLogsSource,
  sql,
  readSql,
  onProposal,
  hidden,
}: LegacyLogsRewriteBannerProps) => {
  const isOtelLogsEnabled = useFlag('otelLegacyLogs')

  const settledSql = useDebounce(sql, LEGACY_LOGS_DIALECT_CHECK_DEBOUNCE_MS)

  const needsRewrite = useMemo(
    () =>
      isLogsSource &&
      shouldOfferLegacyLogsRewrite({ sql: settledSql, isClickhouseLogsEnabled: isOtelLogsEnabled }),
    [isLogsSource, settledSql, isOtelLogsEnabled]
  )

  const { state, requestRewrite, dismiss } = useLegacyLogsRewrite({ readSql, onProposal })

  const hasUnacknowledgedOutcome = state.status === 'failed' || state.status === 'noRewriteNeeded'
  if (hidden || !(needsRewrite || hasUnacknowledgedOutcome)) return null

  return (
    <LegacyLogsRewriteAdmonition state={state} onRewrite={requestRewrite} onDismiss={dismiss} />
  )
}
