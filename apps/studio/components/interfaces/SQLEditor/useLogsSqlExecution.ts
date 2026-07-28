import { useFlag, useParams } from 'common'
import { useCallback } from 'react'

import { DEFAULT_LOG_DATE_RANGE, resolveLogRunRange } from './querySource'
import { useExecuteLogsSqlMutation } from '@/data/logs/execute-logs-sql-mutation'
import { logsAllEndpointUrl } from '@/data/logs/logs-endpoint'
import { type SafeLogSqlFragment } from '@/data/logs/safe-analytics-sql'
import { useTrack } from '@/lib/telemetry/track'
import {
  getSqlEditorSessionSnapshot,
  useSqlEditorSessionSnapshot,
} from '@/state/sql-editor/sql-editor-session-state'

type UseLogsSqlExecutionArgs = { id: string }

/**
 * Logs counterpart to `useSqlEditorExecution`. Runs a promoted
 * `SafeLogSqlFragment` against the analytics OTEL endpoint with the snippet's
 * active time range attached as request params.
 */
export function useLogsSqlExecution({ id }: UseLogsSqlExecutionArgs) {
  const { ref: projectRef } = useParams()
  const isOtelLogsEnabled = useFlag('otelLegacyLogs')
  const track = useTrack()
  const sessionSnap = useSqlEditorSessionSnapshot()

  const { mutate, isPending: isExecuting } = useExecuteLogsSqlMutation({
    onSuccess: (data) => {
      sessionSnap.addResult(id, data.rows)
    },
    onError: (error) => {
      sessionSnap.addResultError(id, error)
    },
  })

  const executeLogsQuery = useCallback(
    (sql: SafeLogSqlFragment) => {
      if (isExecuting || projectRef === undefined) return

      if (!isOtelLogsEnabled) {
        getSqlEditorSessionSnapshot().addResultError(id, {
          message: "Querying logs from the SQL editor isn't available for this project yet.",
        })
        return
      }

      // Re-read imperatively so a range picked immediately before the run is
      // honored; relative ranges re-resolve against `now` here.
      const range = resolveLogRunRange(
        getSqlEditorSessionSnapshot().logRange[id] ?? DEFAULT_LOG_DATE_RANGE
      )

      mutate({ projectRef, sql, range, endpoint: logsAllEndpointUrl(true) })

      track('sql_editor_query_run_button_clicked', { source: 'logs' })
    },
    [id, isExecuting, isOtelLogsEnabled, mutate, projectRef, track]
  )

  return { executeLogsQuery, isExecuting }
}
