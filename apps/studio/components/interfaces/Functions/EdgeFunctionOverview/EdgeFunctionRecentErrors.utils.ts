import type { LogData } from '@/components/interfaces/Settings/Logs/Logs.types'
import type { AlertErrorProps } from '@/components/ui/AlertError'

const NUMERIC_TIMESTAMP_PATTERN = /^\d+(?:\.\d+)?$/

const escapeSqlString = (value: string) => value.replace(/'/g, "''")

export const toAlertError = (error: unknown): AlertErrorProps['error'] | undefined => {
  if (typeof error === 'string') return { message: error }

  if (error && typeof error === 'object') {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string') return { message }
  }

  return undefined
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
