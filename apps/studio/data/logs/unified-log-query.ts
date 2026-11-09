import { queryOptions } from '@tanstack/react-query'
import { IS_PLATFORM } from 'common'

import { executeAnalyticsSql } from './execute-analytics-sql'
import { logsKeys } from './keys'
import { logsAllEndpointUrl } from './logs-endpoint'
import { analyticsLiteral, safeSql } from './safe-analytics-sql'
import { getUnifiedLogsISOStartEnd } from './unified-logs-infinite-query'
import { mapUnifiedLogRow, parseUnifiedLogsQueryRows } from './unified-logs.utils'
import { getUnifiedLogsQuery } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries'
import { getFunctionLogsQuery } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.queries.functions'
import { QuerySearchParamsType } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.types'
import { handleError } from '@/data/fetchers'
import type { StudioError } from '@/lib/errors/studio-errors'

export type UnifiedLogVariables = {
  projectRef?: string
  id?: string
  search: QuerySearchParamsType
}
export type UnifiedLogError = StudioError

async function getUnifiedLog(
  { projectRef, id, search }: UnifiedLogVariables,
  signal?: AbortSignal
) {
  if (!projectRef || !id || !search.scope)
    throw new Error('A project, log ID, and scope are required')

  const { isoTimestampStart, isoTimestampEnd } = getUnifiedLogsISOStartEnd(search)
  const idFilter = safeSql`${IS_PLATFORM ? safeSql`toString(id)` : safeSql`JSON_VALUE(id, '$')`} = ${analyticsLiteral(id)}`
  const data = await executeAnalyticsSql({
    projectRef,
    endpoint: logsAllEndpointUrl(IS_PLATFORM),
    sql: IS_PLATFORM
      ? safeSql`${getUnifiedLogsQuery(search, idFilter)} LIMIT 1`
      : getFunctionLogsQuery(search, idFilter).map((query) => safeSql`${query} LIMIT 1`),
    iso_timestamp_start: isoTimestampStart,
    iso_timestamp_end: isoTimestampEnd,
    signal,
  })
  if (data.error) handleError(new Error(String(data.error)))
  return parseUnifiedLogsQueryRows(data.result).map(mapUnifiedLogRow)[0] ?? null
}

export type UnifiedLogData = Awaited<ReturnType<typeof getUnifiedLog>>

export const unifiedLogQueryOptions = ({ projectRef, search, id }: UnifiedLogVariables) =>
  queryOptions<UnifiedLogData, UnifiedLogError>({
    queryKey: logsKeys.unifiedLog(projectRef, search, id),
    queryFn: ({ signal }) => getUnifiedLog({ projectRef, search, id }, signal),
    enabled: !!projectRef && !!id && !!search.scope,
    refetchOnWindowFocus: false,
  })
