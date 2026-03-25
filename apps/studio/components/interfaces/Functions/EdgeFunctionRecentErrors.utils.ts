import { LOGS_TABLES } from 'components/interfaces/Settings/Logs/Logs.constants'
import type { LogData } from 'components/interfaces/Settings/Logs/Logs.types'
import { genDefaultQuery } from 'components/interfaces/Settings/Logs/Logs.utils'

import { parseEdgeFunctionEventMessage } from './EdgeFunctionRecentInvocations.utils'

export const MAX_RECENT_ERROR_GROUPS = 5
export const RECENT_ERROR_INVOCATIONS_LIMIT = 50
export const RELATED_RUNTIME_LOGS_LIMIT = 100

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

export const toAlertError = (error: unknown): { message: string } | undefined => {
  if (typeof error === 'string') return { message: error }

  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return { message }
  }

  return undefined
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
  const grouped = recentErrorInvocations.reduce<Record<string, RecentErrorGroupBase>>(
    (acc, item) => {
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
      const current = acc[message]

      if (!current) {
        acc[message] = {
          message,
          count: 1,
          lastSeen: timestamp,
          lastExecutionId: executionId || undefined,
          lastStatusCode: statusCode || undefined,
          lastMethod: method || undefined,
          executionTime:
            item.execution_time_ms !== undefined
              ? `${Math.round(Number(item.execution_time_ms))}ms`
              : undefined,
          executionIds: executionId ? [executionId] : [],
        }
        return acc
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
        current.executionTime =
          item.execution_time_ms !== undefined
            ? `${Math.round(Number(item.execution_time_ms))}ms`
            : undefined
      }

      return acc
    },
    {}
  )

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
