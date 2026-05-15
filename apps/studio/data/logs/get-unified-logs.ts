import { useMutation } from '@tanstack/react-query'
import { useFlag } from 'common'
import { toast } from 'sonner'

import { logsAllEndpointUrl, pickLogsQueryBuilder } from './logs-endpoint'
import { getUnifiedLogsISOStartEnd } from './unified-logs-infinite-query'
import { getUnifiedLogsQuery } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries'
import { getUnifiedLogsQuery as getUnifiedLogsQueryBq } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries.bq'
import { QuerySearchParamsType } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'
import { handleError, post } from '@/data/fetchers'
import type { ResponseError, UseCustomMutationOptions } from '@/types'

export type getUnifiedLogsVariables = {
  projectRef: string
  search: QuerySearchParamsType
  limit: number
  hoursAgo?: number
  useOtel?: boolean
}

// [Joshen] Mainly for retrieving logs on demand for downloading
export async function retrieveUnifiedLogs({
  projectRef,
  search,
  limit,
  hoursAgo,
  useOtel = false,
}: getUnifiedLogsVariables) {
  if (typeof projectRef === 'undefined')
    throw new Error('projectRef is required for retrieveUnifiedLogs')

  const { isoTimestampStart, isoTimestampEnd } = getUnifiedLogsISOStartEnd(search, hoursAgo)
  const buildQuery = pickLogsQueryBuilder(useOtel, getUnifiedLogsQuery, getUnifiedLogsQueryBq)
  const sql = `${buildQuery(search)} ORDER BY timestamp DESC, id DESC LIMIT ${limit}`

  const endpoint = logsAllEndpointUrl(useOtel)
  const { data, error } = await post(endpoint, {
    params: { path: { ref: projectRef } },
    body: { iso_timestamp_start: isoTimestampStart, iso_timestamp_end: isoTimestampEnd, sql },
  })

  if (error) handleError(error)

  const resultData = data?.result ?? []

  const result = resultData.map((row: any) => {
    const ts = String(row.timestamp ?? '')
    const looksLikeIso = /[T-]/.test(ts)
    const date = looksLikeIso
      ? new Date(/Z$|[+-]\d{2}:?\d{2}$/.test(ts) ? ts : `${ts}Z`)
      : new Date(Number(ts) / 1000)
    return {
      id: row.id,
      date,
      timestamp: row.timestamp,
      level: row.level,
      status: row.status || 200,
      method: row.method,
      host: row.host,
      pathname: (row.url || '').replace(/^https?:\/\/[^\/]+/, '') || row.pathname || '',
      event_message: row.event_message || row.body || '',
      headers:
        typeof row.headers === 'string' ? JSON.parse(row.headers || '{}') : row.headers || {},
      regions: row.region ? [row.region] : [],
      log_type: row.log_type || '',
      latency: row.latency || 0,
      log_count: row.log_count || null,
      logs: row.logs || [],
      auth_user: row.auth_user || null,
    }
  })

  return result
}

type LogDrainCreateData = Awaited<ReturnType<typeof retrieveUnifiedLogs>>

export const useGetUnifiedLogsMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<LogDrainCreateData, ResponseError, getUnifiedLogsVariables>,
  'mutationFn'
> = {}) => {
  const useOtel = useFlag('otelUnifiedLogs')
  return useMutation<LogDrainCreateData, ResponseError, getUnifiedLogsVariables>({
    mutationFn: (vars) => retrieveUnifiedLogs({ ...vars, useOtel: vars.useOtel ?? useOtel }),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(data, variables, context) {
      if (onError === undefined) {
        toast.error(`Failed to retrieve logs: ${data.message}`)
      } else {
        onError(data, variables, context)
      }
    },
    ...options,
  })
}
