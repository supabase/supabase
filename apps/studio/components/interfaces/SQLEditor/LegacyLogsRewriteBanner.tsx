import { useDebounce } from '@uidotdev/usehooks'
import { useFlag, useParams } from 'common'
import { useMemo, useReducer } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import {
  INITIAL_LEGACY_LOGS_REWRITE_STATE,
  legacyLogsRewriteReducer,
} from './LegacyLogsRewriteBanner.utils'
import { DiffType } from './SQLEditor.types'
import { useSqlEditorAssistant, useSqlEditorRun, useSqlEditorSnippet } from './SQLEditorControllers'
import { LegacyLogsRewriteAdmonition } from '@/components/interfaces/Settings/Logs/LegacyLogsRewriteAdmonition'
import {
  detectLogSource,
  rewriteLogsSqlWithAI,
  shouldOfferLegacyLogsRewrite,
} from '@/components/interfaces/Settings/Logs/logs-sql-rewrite'
import { constructHeaders } from '@/data/fetchers'
import { useOtelLogKeysQuery } from '@/data/logs/otel-log-keys-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { getErrorMessage } from '@/lib/get-error-message'
import {
  getSqlEditorV2StateSnapshot,
  useSqlEditorV2StateSnapshot,
} from '@/state/sql-editor/sql-editor-state'

/** Long enough that the dialect check doesn't run mid-word while typing. */
const DIALECT_CHECK_DEBOUNCE_MS = 500

const CHANGED_WHILE_REWRITING_MESSAGE =
  'The query changed while the Assistant was working, so the rewrite no longer matches it.'

/** Shown when the rewrite request fails, keeping the reason and a retry. */
const RewriteFailedAdmonition = ({
  message,
  onRetry,
  onDismiss,
}: {
  message: string
  onRetry: () => void
  onDismiss: () => void
}) => (
  <Admonition
    type="warning"
    layout="horizontal"
    className="mb-0 rounded-none border-x-0 border-t-0"
    title="Unable to rewrite the query"
    description={message}
    actions={
      <div className="flex items-center gap-2">
        <Button variant="default" size="tiny" onClick={onRetry}>
          Try again
        </Button>
        <Button variant="text" size="tiny" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    }
  />
)

/**
 * Shown when the Assistant hands the query back unchanged. Our dialect check is a
 * heuristic, so this is the Assistant disagreeing with it — say so and let the
 * user close it, rather than opening an empty diff or silently giving up.
 */
const NoRewriteNeededAdmonition = ({ onDismiss }: { onDismiss: () => void }) => (
  <Admonition
    type="default"
    layout="horizontal"
    className="mb-0 rounded-none border-x-0 border-t-0"
    title="No rewrite needed"
    description="The Assistant found nothing to change — this query already runs on ClickHouse."
    actions={
      <Button variant="default" size="tiny" onClick={onDismiss}>
        Dismiss
      </Button>
    }
  />
)

/**
 * Offers to rewrite a logs snippet still written in the old BigQuery dialect
 * (per-service `FROM` tables, `unnest(metadata)` joins) to ClickHouse SQL. Legacy
 * Logs Explorer saved queries open in the SQL editor as `log_sql` snippets, and
 * those queries error against the ClickHouse-backed endpoint the editor runs
 * them on — this is the in-editor path out.
 *
 * The rewrite is proposed through the editor's existing AI diff view rather than
 * replacing the snippet's contents, so the user accepts or discards it the same
 * way as any other AI edit.
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

  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const isOtelLogsEnabled = useFlag('otelLegacyLogs')
  const snapV2 = useSqlEditorV2StateSnapshot()

  const [rewriteState, dispatch] = useReducer(
    legacyLogsRewriteReducer,
    INITIAL_LEGACY_LOGS_REWRITE_STATE
  )

  // The store is written on every keystroke, so debounce before running the
  // dialect heuristics — the banner's visibility doesn't need per-character
  // precision, and a settled value avoids flapping mid-edit.
  const liveSql = snapV2.snippets[id]?.snippet.content?.unchecked_sql ?? ''
  const settledSql = useDebounce(liveSql, DIALECT_CHECK_DEBOUNCE_MS)

  const isLogsSnippetNeedingRewrite = useMemo(
    () =>
      runSource.type === 'logs' &&
      shouldOfferLegacyLogsRewrite({
        sql: settledSql,
        isClickhouseLogsEnabled: isOtelLogsEnabled,
      }),
    [runSource.type, settledSql, isOtelLogsEnabled]
  )

  const hasUnacknowledgedOutcome =
    rewriteState.status === 'failed' || rewriteState.status === 'noRewriteNeeded'
  const canShowBanner =
    !isDiffOpen &&
    rewriteState.status !== 'dismissed' &&
    (isLogsSnippetNeedingRewrite || hasUnacknowledgedOutcome)

  const { data: availableKeys } = useOtelLogKeysQuery(
    { projectRef, source: isLogsSnippetNeedingRewrite ? detectLogSource(settledSql) : undefined },
    { enabled: canShowBanner && isLogsSnippetNeedingRewrite }
  )

  const handleRewrite = async () => {
    if (!projectRef)
      return console.error('[LegacyLogsRewriteBanner > handleRewrite] Project ref is required')

    // Rewrite exactly what's in the editor now, not the debounced value the
    // visibility check used — they differ if the user clicked mid-edit.
    const sql = getSqlEditorV2StateSnapshot().snippets[id]?.snippet.content?.unchecked_sql ?? ''
    if (sql.trim().length === 0) return

    dispatch({ type: 'rewriteRequested' })
    try {
      const headerData = await constructHeaders()
      const rewritten = await rewriteLogsSqlWithAI({
        sql,
        projectRef,
        connectionString: project?.connectionString,
        orgSlug: organization?.slug,
        authorizationHeader: headerData.get('Authorization'),
        availableKeys,
      })

      // The user may have kept typing while the model worked; a diff built from
      // stale text would clobber those edits on accept.
      const latest = getSqlEditorV2StateSnapshot().snippets[id]?.snippet.content?.unchecked_sql
      if (latest !== sql) {
        dispatch({ type: 'rewriteFailed', message: CHANGED_WHILE_REWRITING_MESSAGE })
        return
      }

      // An unchanged response means the query already runs on ClickHouse and our
      // heuristic was over-eager. Opening an empty diff would look broken.
      if (rewritten.trim() === sql.trim()) {
        dispatch({ type: 'rewriteNoop' })
        return
      }

      setSourceSqlDiff({ original: sql, modified: rewritten })
      setSelectedDiffType(DiffType.Modification)
      dispatch({ type: 'rewriteProposed' })
    } catch (error) {
      dispatch({
        type: 'rewriteFailed',
        message: getErrorMessage(error, 'The Assistant did not respond. Try again.'),
      })
    }
  }

  const handleDismiss = () => dispatch({ type: 'dismissed' })

  if (!canShowBanner) return null

  if (rewriteState.status === 'failed') {
    return (
      <RewriteFailedAdmonition
        message={rewriteState.message}
        onRetry={handleRewrite}
        onDismiss={handleDismiss}
      />
    )
  }

  if (rewriteState.status === 'noRewriteNeeded') {
    return <NoRewriteNeededAdmonition onDismiss={handleDismiss} />
  }

  return (
    <LegacyLogsRewriteAdmonition
      isRewriting={rewriteState.status === 'rewriting'}
      onRewrite={handleRewrite}
      onDismiss={handleDismiss}
    />
  )
}
