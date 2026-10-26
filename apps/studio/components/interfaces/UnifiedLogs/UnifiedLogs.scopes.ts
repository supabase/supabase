import type { LOG_TYPES } from './UnifiedLogs.constants'
import type { UnifiedLogsScope } from './UnifiedLogs.types'
import { analyticsLiteral, safeSql, type SafeLogSqlFragment } from '@/data/logs/safe-analytics-sql'

interface UnifiedLogsScopeConfig {
  /** The only log types a scoped view queries and counts */
  logTypes: readonly (typeof LOG_TYPES)[number][]
  /**
   * Matches the scoped resource's rows in the ClickHouse logs table. The BigQuery queries filter
   * each log type's source instead.
   */
  sqlCondition: (scope: UnifiedLogsScope) => SafeLogSqlFragment
}

/** What each scope type narrows a unified logs view to */
export const UNIFIED_LOGS_SCOPES: Record<UnifiedLogsScope['type'], UnifiedLogsScopeConfig> = {
  'edge-function': {
    // The function's invocations plus the runtime output (console, boot, shutdown) they produce
    logTypes: ['edge function', 'edge function runtime'],
    sqlCondition: ({ functionId }) =>
      safeSql`log_attributes['function_id'] = ${analyticsLiteral(functionId)}`,
  },
}
