import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

import { parseEdgeFunctionEventMessage } from '../EdgeFunctionRecentInvocations.utils'
import { LOGS_TABLES } from '@/components/interfaces/Settings/Logs/Logs.constants'
import type { LogData } from '@/components/interfaces/Settings/Logs/Logs.types'
import {
  genCountQuery,
  genDefaultQuery,
  isUnixMicro,
  unixMicroToIsoTimestamp,
} from '@/components/interfaces/Settings/Logs/Logs.utils'
import type { AlertErrorProps } from '@/components/ui/AlertError'

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

export const getSinceLastDeployLogRange = (updatedAt?: string | number, now: Date = new Date()) => {
  const isoTimestampStart = toIsoTimestamp(updatedAt)
  if (!isoTimestampStart) return {}

  const startDate = new Date(isoTimestampStart)
  const normalizedNow = new Date(now)
  const endDate = Number.isNaN(normalizedNow.valueOf()) ? new Date() : normalizedNow

  return {
    isoTimestampStart,
    isoTimestampEnd: new Date(Math.max(startDate.valueOf(), endDate.valueOf())).toISOString(),
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
) =>
  genDefaultQuery(
    LOGS_TABLES.fn_edge,
    {
      function_id: functionId ?? '__pending__',
      'status_code.error': true,
    },
    limit
  )

export const getSinceLastDeployInvocationCountSql = (functionId?: string) =>
  genCountQuery(LOGS_TABLES.fn_edge, {
    function_id: functionId ?? '__pending__',
  })

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
}) => {
  if (!functionId || executionIds.length === 0) return ''

  const escapedExecutionIds = executionIds.map((id) => `'${escapeSqlString(id)}'`).join(', ')

  return `select id, function_logs.timestamp, event_message, metadata.event_type, metadata.function_id, metadata.execution_id, metadata.level from function_logs
cross join unnest(metadata) as metadata
where metadata.function_id = '${escapeSqlString(functionId)}' and metadata.execution_id in (${escapedExecutionIds})
order by timestamp desc
limit ${limit}`
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
