import { getUnifiedLogsDurationMs } from './unified-logs-time-range'

export type UnifiedLogsChartBucket = {
  level: 'SECOND' | 'MINUTE' | 'HOUR' | 'DAY'
  sizeMs: number
}

type ChartTimestamp = Date | string | number | null | undefined
type UnifiedLogsChartRange = { date?: ChartTimestamp[] | null; durationSeconds?: number | null }

const timestampMillis = (value: ChartTimestamp) => {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'string') return new Date(value).getTime()
  if (typeof value === 'number')
    return String(value).length >= 16 ? Math.floor(value / 1000) : value
  return undefined
}

export const getUnifiedLogsChartBucket = (
  search: UnifiedLogsChartRange
): UnifiedLogsChartBucket => {
  const date = search.date ?? []
  const end = timestampMillis(date[1]) ?? Date.now()
  const start = timestampMillis(date[0]) ?? end - getUnifiedLogsDurationMs(search.durationSeconds)
  const duration = end - start
  if (duration < 60_000) return { level: 'SECOND', sizeMs: 1000 }
  if (duration >= 48 * 3600_000) return { level: 'DAY', sizeMs: 86400_000 }
  if (duration >= 12 * 3600_000) return { level: 'HOUR', sizeMs: 3600_000 }
  return { level: 'MINUTE', sizeMs: 60_000 }
}
