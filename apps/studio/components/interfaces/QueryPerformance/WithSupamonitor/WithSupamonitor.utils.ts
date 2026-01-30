import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { transformLogsToJSON } from '../QueryPerformance.utils'

dayjs.extend(utc)

export interface ParsedLogEntry {
  timestamp?: string
  ts?: string
  bucket_start_time?: string
  bucket?: string
  calls?: number
  query?: string
  [key: string]: any
}

export interface ChartDataPoint {
  period_start: number
  timestamp: string
  calls: number
}

export interface SupamonitorRow {
  query: string
  calls: number
}

export const parseSupamonitorLogs = (logData: any[]): ParsedLogEntry[] => {
  if (!logData || logData.length === 0) return []

  const validParsedLogs = logData
    .map((log) => ({
      ...log,
      parsedEventMessage: transformLogsToJSON(log.event_message),
    }))
    .filter((log) => log.parsedEventMessage !== null)

  return validParsedLogs.map((log) => log.parsedEventMessage)
}

export const transformLogsToChartData = (parsedLogs: ParsedLogEntry[]): ChartDataPoint[] => {
  if (!parsedLogs || parsedLogs.length === 0) return []

  return parsedLogs
    .map((log: ParsedLogEntry) => {
      const possibleTimestamps = [log.bucket_start_time, log.bucket, log.timestamp, log.ts]

      let periodStart: number | null = null

      for (const ts of possibleTimestamps) {
        if (ts) {
          const date = new Date(ts)
          const time = date.getTime()
          if (!isNaN(time) && time > 0 && time > 946684800000) {
            periodStart = time
            break
          }
        }
      }

      if (!periodStart) {
        return null
      }

      return {
        period_start: periodStart,
        timestamp: possibleTimestamps.find((t) => t) || '',
        calls: parseInt(String(log.calls ?? 0), 10),
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.period_start - b.period_start)
}

const normalizeQuery = (query: string): string => {
  return query.replace(/\s+/g, ' ').trim()
}

export const aggregateLogsByQuery = (parsedLogs: ParsedLogEntry[]): SupamonitorRow[] => {
  if (!parsedLogs || parsedLogs.length === 0) return []

  const queryGroups = new Map<string, ParsedLogEntry[]>()

  parsedLogs.forEach((log) => {
    const query = normalizeQuery(log.query || '')
    if (!query) return

    if (!queryGroups.has(query)) {
      queryGroups.set(query, [])
    }
    queryGroups.get(query)!.push(log)
  })

  const aggregatedData: SupamonitorRow[] = []

  Array.from(queryGroups.entries()).forEach(([query, logs]) => {
    let totalCalls = 0

    logs.forEach((log) => {
      const logCalls = parseInt(String(log.calls ?? 0), 10)
      totalCalls += logCalls
    })

    aggregatedData.push({
      query,
      calls: totalCalls,
    })
  })

  return aggregatedData.sort((a, b) => b.calls - a.calls)
}
