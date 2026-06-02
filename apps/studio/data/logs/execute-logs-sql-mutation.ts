import { useMutation } from '@tanstack/react-query'

import type { Logs } from '@/components/interfaces/Settings/Logs/Logs.types'
import { executeAnalyticsSql } from '@/data/logs/execute-analytics-sql'
import { logsAllEndpointUrl } from '@/data/logs/logs-endpoint'
import type { SafeLogSqlFragment } from '@/data/logs/safe-analytics-sql'

export interface ExecuteLogsSqlVariables {
  projectRef: string
  sql: string
  iso_timestamp_start: string
  iso_timestamp_end: string
  useOtel?: boolean
}

export async function executeLogsSql({
  projectRef,
  sql,
  iso_timestamp_start,
  iso_timestamp_end,
  useOtel = false,
}: ExecuteLogsSqlVariables) {
  const endpoint = logsAllEndpointUrl(useOtel)
  return executeAnalyticsSql({
    projectRef,
    endpoint,
    // User explicitly clicked Run in the SQL editor — same trust model as logs explorer.
    sql: sql as SafeLogSqlFragment,
    iso_timestamp_start,
    iso_timestamp_end,
  }) as Promise<Logs>
}

export function useExecuteLogsSqlMutation(options?: {
  onSuccess?: (data: Logs, variables: ExecuteLogsSqlVariables) => void
  onError?: (error: Error, variables: ExecuteLogsSqlVariables) => void
}) {
  return useMutation({
    mutationFn: executeLogsSql,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}
