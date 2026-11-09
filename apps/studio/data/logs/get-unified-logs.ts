import { useMutation } from '@tanstack/react-query'
import { IS_PLATFORM } from 'common'
import { toast } from 'sonner'

import { executeAnalyticsSql } from './execute-analytics-sql'
import { logsAllEndpointUrl, pickLogsQueryBuilder } from './logs-endpoint'
import { analyticsLiteral, safeSql } from './safe-analytics-sql'
import { getUnifiedLogsISOStartEnd, useUnifiedLogsBackend } from './unified-logs-infinite-query'
import { mapUnifiedLogRow, parseUnifiedLogsQueryRows } from './unified-logs.utils'
import { getUnifiedLogsQuery } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries'
import { getUnifiedLogsQuery as getUnifiedLogsQueryBq } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries.bq'
import { getFunctionLogsQuery } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries.functions'
import { QuerySearchParamsType } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'
import { handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

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
  const shouldUseOtel = !IS_PLATFORM && search.scope ? false : useOtel || !!search.scope
  const buildQuery = pickLogsQueryBuilder(shouldUseOtel, getUnifiedLogsQuery, getUnifiedLogsQueryBq)
  const sql =
    !shouldUseOtel && search.scope
      ? getFunctionLogsQuery(search).map(
          (query) =>
            safeSql`${query} ORDER BY timestamp DESC, id DESC LIMIT ${analyticsLiteral(limit)}`
        )
      : safeSql`${buildQuery(search)} ORDER BY timestamp DESC, id DESC LIMIT ${analyticsLiteral(limit)}`

  const endpoint = logsAllEndpointUrl(shouldUseOtel)
  const data = await executeAnalyticsSql({
    projectRef,
    endpoint,
    sql,
    iso_timestamp_start: isoTimestampStart,
    iso_timestamp_end: isoTimestampEnd,
  })
  if (data.error) handleError(data.error)

  const resultData = parseUnifiedLogsQueryRows(data?.result)
  if (!shouldUseOtel && search.scope)
    resultData.sort(
      (a, b) =>
        Number(b.timestamp) - Number(a.timestamp) || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0)
    )
  const result = resultData.slice(0, limit).map(mapUnifiedLogRow)

  return result
}

type LogDrainCreateData = Awaited<ReturnType<typeof retrieveUnifiedLogs>>

export const useGetUnifiedLogsMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<LogDrainCreateData, StudioError, getUnifiedLogsVariables>,
  'mutationFn'
> = {}) => {
  const useOtel = useUnifiedLogsBackend()
  return useMutation<LogDrainCreateData, StudioError, getUnifiedLogsVariables>({
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
