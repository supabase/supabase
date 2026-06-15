import { useMutation } from '@tanstack/react-query'

import { executeAnalyticsSql } from './execute-analytics-sql'
import { logsAllEndpointUrl } from './logs-endpoint'
import type { SafeLogSqlFragment } from './safe-analytics-sql'
import type { Logs } from '@/components/interfaces/Settings/Logs/Logs.types'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type ExecuteLogSqlVariables = {
  projectRef: string
  sql: SafeLogSqlFragment
  iso_timestamp_start: string
  iso_timestamp_end: string
  useOtel?: boolean
}

export async function executeLogSql({
  projectRef,
  sql,
  iso_timestamp_start,
  iso_timestamp_end,
  useOtel = false,
}: ExecuteLogSqlVariables) {
  return executeAnalyticsSql({
    projectRef,
    endpoint: logsAllEndpointUrl(useOtel),
    sql,
    iso_timestamp_start,
    iso_timestamp_end,
    method: 'get',
  }) as Promise<Logs>
}

export type ExecuteLogSqlData = Awaited<ReturnType<typeof executeLogSql>>
export type ExecuteLogSqlError = ResponseError

export const useExecuteLogSqlMutation = ({
  ...options
}: Omit<
  UseCustomMutationOptions<ExecuteLogSqlData, ExecuteLogSqlError, ExecuteLogSqlVariables>,
  'mutationFn'
> = {}) =>
  useMutation<ExecuteLogSqlData, ExecuteLogSqlError, ExecuteLogSqlVariables>({
    mutationFn: (args) => executeLogSql(args),
    ...options,
  })
