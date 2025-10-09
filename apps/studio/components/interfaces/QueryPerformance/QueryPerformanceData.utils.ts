import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { transformLogsToJSON } from './QueryPerformanceChart/QueryPerformanceChart.utils'

dayjs.extend(utc)

export interface ParsedLogEntry {
  bucket_start_time?: string
  bucket?: string
  timestamp?: string
  ts?: string
  mean_time?: number
  mean_exec_time?: number
  mean_query_time?: number
  min_time?: number
  min_exec_time?: number
  min_query_time?: number
  max_time?: number
  max_exec_time?: number
  max_query_time?: number
  stddev_time?: number
  stddev_exec_time?: number
  stddev_query_time?: number
  rows?: number
  calls?: number
  shared_blks_hit?: number
  shared_blks_read?: number
  query?: string
  userid?: string
  rolname?: string
  [key: string]: any
}

export interface ChartDataPoint {
  period_start: number
  timestamp: string
  query_latency: number
  mean_time: number
  min_time: number
  max_time: number
  stddev_time: number
  rows_read: number
  calls: number
  cache_hits: number
  cache_misses: number
}

export interface AggregatedQueryData {
  query: string
  rolname?: string
  calls: number
  mean_time: number
  min_time: number
  max_time: number
  total_time: number
  rows_read: number
  cache_hit_rate: number
  prop_total_time: number
  index_advisor_result?: any // Optional since pg_stat_monitor doesn't provide this
  // For internal calculations
  _total_cache_hits: number
  _total_cache_misses: number
  _count: number
}

export const parsePgStatMonitorLogs = (logData: any[]): ParsedLogEntry[] => {
  if (!logData || logData.length === 0) return []

  const validParsedLogs = logData
    .map((log) => ({
      ...log,
      parsedEventMessage: transformLogsToJSON(log.event_message),
    }))
    .filter((log) => log.parsedEventMessage !== null)

  console.log(`Successfully parsed: ${validParsedLogs.length}/${logData.length}`)

  return validParsedLogs.map((log) => log.parsedEventMessage)
}

export const transformLogsToChartData = (parsedLogs: ParsedLogEntry[]): ChartDataPoint[] => {
  if (!parsedLogs || parsedLogs.length === 0) return []

  // [kemal]: here for debugging
  if (parsedLogs.length > 0) {
    console.log('Parsed logs:', parsedLogs)
  }

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
        query_latency: parseFloat(
          String(log.mean_time ?? log.mean_exec_time ?? log.mean_query_time ?? 0)
        ),
        mean_time: parseFloat(
          String(log.mean_time ?? log.mean_exec_time ?? log.mean_query_time ?? 0)
        ),
        min_time: parseFloat(String(log.min_time ?? log.min_exec_time ?? log.min_query_time ?? 0)),
        max_time: parseFloat(String(log.max_time ?? log.max_exec_time ?? log.max_query_time ?? 0)),
        stddev_time: parseFloat(
          String(log.stddev_time ?? log.stddev_exec_time ?? log.stddev_query_time ?? 0)
        ),
        rows_read: parseInt(String(log.rows ?? 0), 10),
        calls: parseInt(String(log.calls ?? 0), 10),
        cache_hits: parseFloat(String(log.shared_blks_hit ?? 0)),
        cache_misses: parseFloat(String(log.shared_blks_read ?? 0)),
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.period_start - b.period_start)
}

const normalizeQuery = (query: string): string => {
  return query.replace(/\s+/g, ' ').trim()
}

export const aggregateLogsByQuery = (parsedLogs: ParsedLogEntry[]): AggregatedQueryData[] => {
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

  const aggregatedData: AggregatedQueryData[] = []
  let totalExecutionTime = 0

  const queryStats = Array.from(queryGroups.entries()).map(([query, logs]) => {
    const count = logs.length
    let totalMeanTime = 0
    let totalMinTime = 0
    let totalMaxTime = 0
    let totalCalls = 0
    let totalRowsRead = 0
    let totalCacheHits = 0
    let totalCacheMisses = 0
    let rolname = logs[0].username

    logs.forEach((log) => {
      totalMeanTime += parseFloat(
        String(log.mean_time ?? log.mean_exec_time ?? log.mean_query_time ?? 0)
      )
      totalMinTime += parseFloat(
        String(log.min_time ?? log.min_exec_time ?? log.min_query_time ?? 0)
      )
      totalMaxTime += parseFloat(
        String(log.max_time ?? log.max_exec_time ?? log.max_query_time ?? 0)
      )
      totalCalls += parseInt(String(log.calls ?? 0), 10)
      totalRowsRead += parseInt(String(log.rows ?? 0), 10)
      totalCacheHits += parseFloat(String(log.shared_blks_hit ?? 0))
      totalCacheMisses += parseFloat(String(log.shared_blks_read ?? 0))
    })

    const avgMeanTime = totalMeanTime / count
    const avgMinTime = totalMinTime / count
    const avgMaxTime = totalMaxTime / count
    const avgCalls = totalCalls / count
    const avgRowsRead = totalRowsRead / count

    const totalTime = avgMeanTime * avgCalls

    totalExecutionTime += totalTime

    return {
      query,
      rolname,
      count,
      avgMeanTime,
      avgMinTime,
      avgMaxTime,
      avgCalls,
      avgRowsRead,
      totalTime,
      totalCacheHits,
      totalCacheMisses,
    }
  })

  queryStats.forEach((stats) => {
    const totalCacheAccess = stats.totalCacheHits + stats.totalCacheMisses
    const cacheHitRate = totalCacheAccess > 0 ? (stats.totalCacheHits / totalCacheAccess) * 100 : 0

    const propTotalTime = totalExecutionTime > 0 ? (stats.totalTime / totalExecutionTime) * 100 : 0

    aggregatedData.push({
      query: stats.query,
      rolname: stats.rolname,
      calls: Math.round(stats.avgCalls),
      mean_time: stats.avgMeanTime,
      min_time: stats.avgMinTime,
      max_time: stats.avgMaxTime,
      total_time: stats.totalTime,
      rows_read: Math.round(stats.avgRowsRead),
      cache_hit_rate: cacheHitRate,
      prop_total_time: propTotalTime,
      _total_cache_hits: stats.totalCacheHits,
      _total_cache_misses: stats.totalCacheMisses,
      _count: stats.count,
    })
  })

  console.log('Aggregated data:', aggregatedData)

  return aggregatedData.sort((a, b) => b.total_time - a.total_time)
}
