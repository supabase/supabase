import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { parseEdgeFunctionEventMessage } from '../EdgeFunctionRecentInvocations.utils'
import type { LogData } from '@/components/interfaces/Settings/Logs/Logs.types'
import {
  isUnixMicro,
  unixMicroToIsoTimestamp,
} from '@/components/interfaces/Settings/Logs/Logs.utils'
import type { AlertErrorProps } from '@/components/ui/AlertError'
import { DOCS_URL } from '@/lib/constants'

dayjs.extend(relativeTime)

export const MAX_RECENT_ERROR_GROUPS = 5
export const RECENT_ERROR_INVOCATIONS_LIMIT = 50
export const RELATED_RUNTIME_LOGS_LIMIT = 100
const NUMERIC_TIMESTAMP_PATTERN = /^\d+(?:\.\d+)?$/

export type GroupedRuntimeLog = {
  key: string
  message: string
  level: string
  count: number
  lastSeen: number
}

export type RecentErrorGroup = {
  message: string
  count: number
  lastSeen: number
  lastExecutionId?: string
  lastStatusCode?: string
  lastMethod?: string
  executionTime?: string
  executionIds: string[]
  logs: GroupedRuntimeLog[]
}

export type RecentErrorGroupBase = Omit<RecentErrorGroup, 'logs'>

export const escapeSqlString = (value: string) => value.replace(/'/g, "''")

export const formatSingleLineMessage = (message: string) => message.replace(/\s+/g, ' ').trim()

/**
 * Trims a runtime error message down to the meaningful summary, dropping the
 * stack trace that follows the first ` at ` frame so we can show it inline in
 * a table cell.
 */
export const summarizeErrorMessage = (message: string): string => {
  const collapsed = formatSingleLineMessage(message)
  if (!collapsed) return collapsed

  const stackFrameMatch = collapsed.match(/\s+at\s+\S+\s+\(/)
  if (stackFrameMatch && stackFrameMatch.index !== undefined) {
    return collapsed.slice(0, stackFrameMatch.index).trim()
  }
  return collapsed
}

/**
 * Picks the most useful error description for a group. The invocation
 * `event_message` only contains the request URL, so when we have a related
 * runtime error log we surface its summary instead.
 */
export const getDisplayErrorMessage = (group: RecentErrorGroup): string => {
  const errorLog = group.logs.find((log) => log.level === 'error')
  if (errorLog) {
    const summary = summarizeErrorMessage(errorLog.message)
    if (summary) return summary
  }
  return summarizeErrorMessage(group.message)
}

const TROUBLESHOOTING_DOCS_BASE = `${DOCS_URL}/guides/troubleshooting`

export const buildTroubleshootingDocsUrl = ({ statusCode }: { statusCode?: string }): string => {
  const numericStatusCode = Number(statusCode)
  if (Number.isFinite(numericStatusCode) && numericStatusCode >= 100) {
    return `${TROUBLESHOOTING_DOCS_BASE}/edge-function-${numericStatusCode}-response`
  }
  return `${TROUBLESHOOTING_DOCS_BASE}?search=${encodeURIComponent('edge function')}`
}

export const toAlertError = (error: unknown): AlertErrorProps['error'] | undefined => {
  if (typeof error === 'string') return { message: error }

  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return { message }
  }

  return undefined
}

export const formatLogTimestamp = (
  value: string | number | undefined,
  format: 'relative' | 'time'
) => {
  if (value === undefined) return '-'

  const timestamp = isUnixMicro(value) ? unixMicroToIsoTimestamp(value) : String(value)
  return format === 'relative'
    ? dayjs.utc(timestamp).fromNow()
    : dayjs.utc(timestamp).format('HH:mm:ss')
}

export const toIsoTimestamp = (value?: string | number) => {
  if (value === undefined) return undefined

  const normalizedValue = typeof value === 'string' ? value.trim() : value
  if (normalizedValue === '') return undefined

  const stringValue = String(normalizedValue)
  const isNumericTimestamp = NUMERIC_TIMESTAMP_PATTERN.test(stringValue)
  const date = (() => {
    if (!isNumericTimestamp) return new Date(stringValue)

    const numericValue = Number(stringValue)
    if (!Number.isFinite(numericValue)) return new Date(NaN)

    if (stringValue.length >= 16) return new Date(numericValue / 1000)
    if (stringValue.length <= 10) return new Date(numericValue * 1000)
    return new Date(numericValue)
  })()

  return Number.isNaN(date.valueOf()) ? undefined : date.toISOString()
}

export const SINCE_LAST_DEPLOY_MAX_RANGE_MS = 24 * 60 * 60 * 1000

export const getSinceLastDeployLogRange = (updatedAt?: string | number, now: Date = new Date()) => {
  const isoTimestampStart = toIsoTimestamp(updatedAt)
  if (!isoTimestampStart) return {}

  const startDate = new Date(isoTimestampStart)
  const normalizedNow = new Date(now)
  const nowDate = Number.isNaN(normalizedNow.valueOf()) ? new Date() : normalizedNow
  const endDate = new Date(Math.max(startDate.valueOf(), nowDate.valueOf()))
  const earliestAllowedStart = endDate.valueOf() - SINCE_LAST_DEPLOY_MAX_RANGE_MS

  return {
    isoTimestampStart: new Date(Math.max(startDate.valueOf(), earliestAllowedStart)).toISOString(),
    isoTimestampEnd: endDate.toISOString(),
  }
}

export const buildGroupMarkdown = (group: RecentErrorGroup, functionSlug?: string) => {
  const lines = [
    `## Error since last deploy for \`${functionSlug ?? 'edge function'}\``,
    '',
    `### ${group.message}`,
    `- Occurrences: ${group.count}`,
    `- Last seen: ${formatLogTimestamp(group.lastSeen, 'relative')}`,
  ]

  if (group.lastMethod) lines.push(`- Last method: ${group.lastMethod}`)
  if (group.lastStatusCode) lines.push(`- Last status: ${group.lastStatusCode}`)
  if (group.executionTime) lines.push(`- Last execution time: ${group.executionTime}`)

  lines.push('', '#### Related runtime logs')

  if (group.logs.length === 0) {
    lines.push('- No related runtime logs found for this error group.')
  } else {
    for (const log of group.logs) {
      lines.push(
        `- [${log.level}] ${log.count} occurrence${
          log.count === 1 ? '' : 's'
        }, last seen ${formatLogTimestamp(log.lastSeen, 'relative')}: ${log.message}`
      )
    }
  }

  return lines.join('\n')
}

export const buildGroupAssistantPrompt = (group: RecentErrorGroup, functionSlug?: string) => {
  return [
    `Analyze this edge function error since the last deploy for \`${functionSlug ?? 'edge function'}\`.`,
    'Summarize the likely root cause, what the runtime logs suggest, and the next debugging steps.',
    '',
    buildGroupMarkdown(group, functionSlug),
  ].join('\n')
}

export const getStatusBadgeVariant = (statusCode?: string) => {
  if (!statusCode) return 'destructive' as const

  const status = Number(statusCode)
  if (Number.isNaN(status)) return 'destructive' as const
  if (status >= 500) return 'destructive' as const

  return 'default' as const
}

export const getRecentErrorInvocationsSql = (
  functionId?: string,
  limit = RECENT_ERROR_INVOCATIONS_LIMIT
): string => {
  const id = escapeSqlString(functionId ?? '__pending__')
  return `
-- errors since last deploy
select
  toUnixTimestamp64Micro(timestamp) as timestamp,
  event_message,
  log_attributes['request.method'] as method,
  log_attributes['response.status_code'] as status_code,
  toFloat64OrZero(log_attributes['execution_time_ms']) as execution_time_ms,
  log_attributes['execution_id'] as execution_id
from logs
where
  source = 'function_edge_logs'
  and log_attributes['function_id'] = '${id}'
  and toInt32OrZero(log_attributes['response.status_code']) >= 500
order by timestamp desc
limit ${limit}
`.trim()
}

export const getSinceLastDeployInvocationCountSql = (functionId?: string): string => {
  const id = escapeSqlString(functionId ?? '__pending__')
  return `-- invocation count since last deploy
select count() as count from logs where source = 'function_edge_logs' and log_attributes['function_id'] = '${id}'`
}

export const getSinceLastDeployInvocationCount = (invocationCountRows: LogData[]) => {
  const count = Number(invocationCountRows[0]?.count ?? 0)
  return Number.isFinite(count) ? count : 0
}

export const getSinceLastDeployInvocationPhrase = (invocationCount: number) => {
  const formattedCount = invocationCount.toLocaleString('en-US')
  const invocationLabel = invocationCount === 1 ? 'invocation' : 'invocations'

  return `${formattedCount} ${invocationLabel}`
}

export const getNoErrorsSinceLastDeployMessage = (invocationCount: number) => {
  const verb = invocationCount === 1 ? 'has' : 'have'
  const invocationPhrase = getSinceLastDeployInvocationPhrase(invocationCount)

  return `There ${verb} been ${invocationPhrase} since last deploy and no errors.`
}

export const getFunctionRuntimeLogsSql = ({
  functionId,
  executionIds,
  limit = RELATED_RUNTIME_LOGS_LIMIT,
}: {
  functionId?: string
  executionIds: string[]
  limit?: number
}): string => {
  if (!functionId || executionIds.length === 0) return ''

  const escapedFunctionId = escapeSqlString(functionId)
  const escapedExecutionIds = executionIds.map((id) => `'${escapeSqlString(id)}'`).join(', ')

  return `
-- runtime logs for error groups
select
  toUnixTimestamp64Micro(timestamp) as timestamp,
  event_message,
  log_attributes['level'] as level,
  log_attributes['event_type'] as event_type,
  log_attributes['function_id'] as function_id,
  log_attributes['execution_id'] as execution_id
from logs
where
  source = 'function_logs'
  and log_attributes['function_id'] = '${escapedFunctionId}'
  and log_attributes['execution_id'] in (${escapedExecutionIds})
order by timestamp desc
limit ${limit}
`.trim()
}

export const getRecentErrorGroupsBase = (
  recentErrorInvocations: LogData[]
): RecentErrorGroupBase[] => {
  const grouped: Record<string, RecentErrorGroupBase> = {}

  for (const item of recentErrorInvocations) {
    const statusCode = String(item.status_code ?? '')
    const method = String(item.method ?? '')
    const message =
      parseEdgeFunctionEventMessage(
        String(item.event_message ?? ''),
        method || undefined,
        statusCode
      ) || 'Unknown error'
    const executionId = String(item.execution_id ?? '')
    const timestamp = Number(item.timestamp ?? 0)
    const executionTime =
      item.execution_time_ms !== undefined
        ? `${Math.round(Number(item.execution_time_ms))}ms`
        : undefined
    const current = grouped[message]

    if (!current) {
      grouped[message] = {
        message,
        count: 1,
        lastSeen: timestamp,
        lastExecutionId: executionId || undefined,
        lastStatusCode: statusCode || undefined,
        lastMethod: method || undefined,
        executionTime,
        executionIds: executionId ? [executionId] : [],
      }
      continue
    }

    current.count += 1

    if (executionId && !current.executionIds.includes(executionId)) {
      current.executionIds.push(executionId)
    }

    if (timestamp > current.lastSeen) {
      current.lastSeen = timestamp
      current.lastExecutionId = executionId || undefined
      current.lastStatusCode = statusCode || undefined
      current.lastMethod = method || undefined
      current.executionTime = executionTime
    }
  }

  return Object.values(grouped)
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, MAX_RECENT_ERROR_GROUPS)
}

export const getRelatedExecutionIds = (recentErrorGroupsBase: RecentErrorGroupBase[]) =>
  Array.from(new Set(recentErrorGroupsBase.flatMap((group) => group.executionIds).filter(Boolean)))

export const getRecentErrorGroups = ({
  recentErrorGroupsBase,
  functionRuntimeLogs,
}: {
  recentErrorGroupsBase: RecentErrorGroupBase[]
  functionRuntimeLogs: LogData[]
}): RecentErrorGroup[] => {
  const runtimeLogsByExecutionId = functionRuntimeLogs.reduce<Record<string, LogData[]>>(
    (acc, log) => {
      const executionId = String(log.execution_id ?? '')
      if (!executionId) return acc

      acc[executionId] = [...(acc[executionId] ?? []), log]
      return acc
    },
    {}
  )

  return recentErrorGroupsBase.map((group) => ({
    ...group,
    logs: Array.from(new Set(group.executionIds))
      .flatMap((executionId) => runtimeLogsByExecutionId[executionId] ?? [])
      .reduce<GroupedRuntimeLog[]>((acc, log) => {
        const level = String(log.level ?? log.event_type ?? 'log')
        const message = String(log.event_message ?? '')
        const key = `${level}:${message}`
        const timestamp = Number(log.timestamp ?? 0)
        const existing = acc.find((entry) => entry.key === key)

        if (existing) {
          existing.count += 1
          existing.lastSeen = Math.max(existing.lastSeen, timestamp)
          return acc
        }

        acc.push({ key, message, level, count: 1, lastSeen: timestamp })
        return acc
      }, [])
      .sort((a, b) => b.count - a.count || b.lastSeen - a.lastSeen)
      .slice(0, MAX_RECENT_ERROR_GROUPS),
  }))
}
