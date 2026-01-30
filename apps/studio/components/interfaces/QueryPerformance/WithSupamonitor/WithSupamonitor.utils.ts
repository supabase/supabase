import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { QueryPerformanceRow } from '../QueryPerformance.types'
import { calculatePercentilesFromHistogram } from '../WithMonitor/WithMonitor.utils'

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
  username?: string
  resp_calls?: number[]
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
  p50_time: number
  p95_time: number
  rows_read: number
  calls: number
  cache_hits: number
  cache_misses: number
}

export const parseSupamonitorLogs = (logData: any[]): ParsedLogEntry[] => {
  if (!logData || logData.length === 0) {
    console.log('⚠️ parseSupamonitorLogs: No logData')
    return []
  }

  console.log('🔍 parseSupamonitorLogs: Processing', logData.length, 'logs')
  console.log('🔍 First log event_message:', logData[0]?.event_message)
  console.log('🔍 First log original keys:', Object.keys(logData[0] || {}))

  const validParsedLogs = logData
    .map((log) => {
      let jsonString = log.event_message || ''

      const colonIndex = jsonString.indexOf(':')
      if (colonIndex !== -1) {
        jsonString = jsonString.substring(colonIndex + 1).trim()
      }

      try {
        const parsed = JSON.parse(jsonString)
        return {
          ...parsed,
          timestamp: log.timestamp || parsed.timestamp,
          id: log.id,
          log_type: log.log_type,
          status: log.status,
          level: log.level,
        }
      } catch (error) {
        console.log('❌ Failed to parse JSON:', jsonString.substring(0, 100), error)
        return null
      }
    })
    .filter((log) => log !== null)

  console.log('✅ Successfully parsed', validParsedLogs.length, 'out of', logData.length, 'logs')

  if (validParsedLogs.length > 0) {
    console.log('📦 First parsed entry keys:', Object.keys(validParsedLogs[0]))
    console.log('📦 First parsed entry:', validParsedLogs[0])
  }
  return validParsedLogs
}

export const transformLogsToChartData = (parsedLogs: ParsedLogEntry[]): ChartDataPoint[] => {
  if (!parsedLogs || parsedLogs.length === 0) {
    console.log('⚠️ transformLogsToChartData: No parsedLogs')
    return []
  }

  console.log('📊 transformLogsToChartData: Processing', parsedLogs.length, 'parsed logs')

  if (parsedLogs.length > 0) {
    const firstLog = parsedLogs[0]
    console.log('🔍 First log all fields:', firstLog)
    console.log('🔍 First log keys:', Object.keys(firstLog))

    const timeFields = Object.keys(firstLog).filter(
      (key) =>
        key.toLowerCase().includes('time') ||
        key.toLowerCase().includes('exec') ||
        key.toLowerCase().includes('duration') ||
        key.toLowerCase().includes('latency')
    )
    console.log('🔍 Time-related fields found:', timeFields)
    timeFields.forEach((field) => {
      console.log(`  - ${field}:`, firstLog[field], typeof firstLog[field])
    })
  }

  const result = parsedLogs
    .map((log: ParsedLogEntry, index: number) => {
      const possibleTimestamps = [
        log.timestamp,
        log.bucket_start_time,
        log.bucket,
        log.ts,
        log.time,
        log.period_start,
        log.metadata?.timestamp,
        log.metadata?.time,
      ].filter(Boolean)

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

      if (!periodStart && index === 0) {
        console.log('❌ No valid timestamp found in first log. Available keys:', Object.keys(log))
        console.log('❌ Timestamp values tried:', {
          timestamp: log.timestamp,
          bucket_start_time: log.bucket_start_time,
          bucket: log.bucket,
          ts: log.ts,
          time: log.time,
          period_start: log.period_start,
        })
        console.log('❌ Full first log object:', log)
      }

      if (!periodStart) {
        return null
      }

      const percentiles =
        log.resp_calls && Array.isArray(log.resp_calls)
          ? calculatePercentilesFromHistogram(log.resp_calls)
          : { p50: 0, p95: 0 }

      const meanTime = parseFloat(
        String(
          log.mean_time ??
            log.mean_exec_time ??
            log.mean_query_time ??
            log.avg_time ??
            log.average_time ??
            log.exec_time ??
            log.query_time ??
            log.total_time ??
            (log as any).mean ??
            (log as any).avg ??
            0
        )
      )

      const minTime = parseFloat(
        String(log.min_time ?? log.min_exec_time ?? log.min_query_time ?? (log as any).min ?? 0)
      )

      const maxTime = parseFloat(
        String(log.max_time ?? log.max_exec_time ?? log.max_query_time ?? (log as any).max ?? 0)
      )

      const stddevTime = parseFloat(
        String(
          log.stddev_time ??
            log.stddev_exec_time ??
            log.stddev_query_time ??
            (log as any).stddev ??
            0
        )
      )

      const calls = parseInt(
        String(log.calls ?? log.call_count ?? log.total_calls ?? log.count ?? 0),
        10
      )
      const rowsRead = parseInt(String(log.rows ?? log.rows_read ?? log.total_rows ?? 0), 10)
      const cacheHits = parseFloat(String(log.shared_blks_hit ?? log.cache_hits ?? log.hits ?? 0))
      const cacheMisses = parseFloat(
        String(log.shared_blks_read ?? log.cache_misses ?? log.misses ?? 0)
      )

      if (index === 0) {
        console.log('✅ First log transformed:', {
          periodStart,
          meanTime,
          minTime,
          maxTime,
          calls,
          rowsRead,
          cacheHits,
          cacheMisses,
          'raw mean_time field': log.mean_time,
          'raw mean_exec_time field': log.mean_exec_time,
          'raw mean_query_time field': log.mean_query_time,
        })
      }

      return {
        period_start: periodStart,
        timestamp: possibleTimestamps[0] || '',
        query_latency: meanTime,
        mean_time: meanTime,
        min_time: minTime,
        max_time: maxTime,
        stddev_time: stddevTime,
        p50_time: percentiles.p50,
        p95_time: percentiles.p95,
        rows_read: rowsRead,
        calls: calls,
        cache_hits: cacheHits,
        cache_misses: cacheMisses,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.period_start - b.period_start)

  console.log('📊 transformLogsToChartData: Created', result.length, 'chart data points')
  return result
}

const normalizeQuery = (query: string): string => {
  return query.replace(/\s+/g, ' ').trim()
}

export const aggregateLogsByQuery = (parsedLogs: ParsedLogEntry[]): QueryPerformanceRow[] => {
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

  const aggregatedData: QueryPerformanceRow[] = []
  let totalExecutionTime = 0

  const queryStats = Array.from(queryGroups.entries()).map(([query, logs]) => {
    const count = logs.length
    let totalCalls = 0
    let totalRowsRead = 0
    let totalCacheHits = 0
    let totalCacheMisses = 0
    let rolname = logs[0]?.rolname || logs[0]?.username || logs[0]?.userid || ''
    let minTime = Infinity
    let maxTime = -Infinity
    let totalExecutionTimeForQuery = 0

    logs.forEach((log) => {
      const logMeanTime = parseFloat(
        String(
          log.mean_time ??
            log.mean_exec_time ??
            log.mean_query_time ??
            log.avg_time ??
            log.average_time ??
            log.exec_time ??
            log.query_time ??
            (log as any).mean ??
            (log as any).avg ??
            0
        )
      )

      const logMinTime = parseFloat(
        String(log.min_time ?? log.min_exec_time ?? log.min_query_time ?? (log as any).min ?? 0)
      )

      const logMaxTime = parseFloat(
        String(log.max_time ?? log.max_exec_time ?? log.max_query_time ?? (log as any).max ?? 0)
      )

      const logCalls = parseInt(
        String(log.calls ?? log.call_count ?? log.total_calls ?? log.count ?? 0),
        10
      )
      const logRows = parseInt(String(log.rows ?? log.rows_read ?? log.total_rows ?? 0), 10)
      const logCacheHits = parseFloat(
        String(log.shared_blks_hit ?? log.cache_hits ?? log.hits ?? 0)
      )
      const logCacheMisses = parseFloat(
        String(log.shared_blks_read ?? log.cache_misses ?? log.misses ?? 0)
      )

      minTime = Math.min(minTime, logMinTime)
      maxTime = Math.max(maxTime, logMaxTime)
      totalCalls += logCalls
      totalRowsRead += logRows
      totalCacheHits += logCacheHits
      totalCacheMisses += logCacheMisses
      totalExecutionTimeForQuery += logMeanTime * logCalls
    })

    const avgMeanTime = totalCalls > 0 ? totalExecutionTimeForQuery / totalCalls : 0
    const finalMinTime = minTime === Infinity ? 0 : minTime
    const finalMaxTime = maxTime === -Infinity ? 0 : maxTime

    totalExecutionTime += totalExecutionTimeForQuery

    return {
      query,
      rolname,
      count,
      avgMeanTime,
      minTime: finalMinTime,
      maxTime: finalMaxTime,
      totalCalls,
      totalRowsRead,
      totalTime: totalExecutionTimeForQuery,
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
      calls: stats.totalCalls,
      mean_time: stats.avgMeanTime,
      min_time: stats.minTime,
      max_time: stats.maxTime,
      total_time: stats.totalTime,
      rows_read: stats.totalRowsRead,
      cache_hit_rate: cacheHitRate,
      prop_total_time: propTotalTime,
      index_advisor_result: null,
      _total_cache_hits: stats.totalCacheHits,
      _total_cache_misses: stats.totalCacheMisses,
      _count: stats.count,
    })
  })

  return aggregatedData.sort((a, b) => b.total_time - a.total_time)
}
