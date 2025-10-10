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
  resp_calls?: number[] // Add this - histogram array
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
  // Add these percentile fields
  p50_time: number
  p75_time: number
  p90_time: number
  p95_time: number
  p99_time: number
  p99_9_time: number
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
    .filter((log) => log.parsedEventMessage?.event === 'bucket_query')

  return validParsedLogs.map((log) => log.parsedEventMessage)
}

export const transformLogsToChartData = (parsedLogs: ParsedLogEntry[]): ChartDataPoint[] => {
  if (!parsedLogs || parsedLogs.length === 0) return []

  // [kemal]: here for debugging
  if (parsedLogs.length > 0) {
    console.log('🟡 Parsed logs:', parsedLogs)
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

      const percentiles =
        log.resp_calls && Array.isArray(log.resp_calls)
          ? calculatePercentilesFromHistogram(log.resp_calls)
          : { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0, p99_9: 0 }

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
        // Add calculated percentiles
        p50_time: percentiles.p50,
        p75_time: percentiles.p75,
        p90_time: percentiles.p90,
        p95_time: percentiles.p95,
        p99_time: percentiles.p99,
        p99_9_time: percentiles.p99_9,
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
    let totalCalls = 0
    let totalRowsRead = 0
    let totalCacheHits = 0
    let totalCacheMisses = 0
    let rolname = logs[0].username
    let minTime = Infinity
    let maxTime = -Infinity
    let totalExecutionTimeForQuery = 0

    logs.forEach((log) => {
      const logMeanTime = parseFloat(
        String(log.mean_time ?? log.mean_exec_time ?? log.mean_query_time ?? 0)
      )
      const logMinTime = parseFloat(
        String(log.min_time ?? log.min_exec_time ?? log.min_query_time ?? 0)
      )
      const logMaxTime = parseFloat(
        String(log.max_time ?? log.max_exec_time ?? log.max_query_time ?? 0)
      )
      const logCalls = parseInt(String(log.calls ?? 0), 10)
      const logRows = parseInt(String(log.rows ?? 0), 10)
      const logCacheHits = parseFloat(String(log.shared_blks_hit ?? 0))
      const logCacheMisses = parseFloat(String(log.shared_blks_read ?? 0))

      minTime = Math.min(minTime, logMinTime)
      maxTime = Math.max(maxTime, logMaxTime)

      totalCalls += logCalls
      totalRowsRead += logRows
      totalCacheHits += logCacheHits
      totalCacheMisses += logCacheMisses

      // Total execution time = sum of (mean_time * calls) for each bucket
      totalExecutionTimeForQuery += logMeanTime * logCalls
    })

    // Overall mean time is the weighted average
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
      _total_cache_hits: stats.totalCacheHits,
      _total_cache_misses: stats.totalCacheMisses,
      _count: stats.count,
    })
  })

  console.log('🏓 Aggregated data:', aggregatedData)

  return aggregatedData.sort((a, b) => b.total_time - a.total_time)
}

// Add this function to calculate percentiles from histogram
export const calculatePercentilesFromHistogram = (
  respCalls: number[]
): {
  p50: number
  p75: number
  p90: number
  p95: number
  p99: number
  p99_9: number
} => {
  const bucketBoundaries = [
    { min: 0, max: 1 },
    { min: 1, max: 10 },
    { min: 10, max: 100 },
    { min: 100, max: 1000 },
    { min: 1000, max: 10000 },
    { min: 10000, max: 100000 },
  ]

  const totalCalls = respCalls.reduce((sum, count) => sum + count, 0)

  if (totalCalls === 0) {
    return { p50: 0, p75: 0, p90: 0, p95: 0, p99: 0, p99_9: 0 }
  }

  // Create distribution with better interpolation within buckets
  const distribution: {
    minValue: number
    maxValue: number
    cumulativeCount: number
    count: number
  }[] = []
  let cumulativeCount = 0

  respCalls.forEach((count, index) => {
    if (count > 0 && index < bucketBoundaries.length) {
      const bucket = bucketBoundaries[index]
      cumulativeCount += count
      distribution.push({
        minValue: bucket.min,
        maxValue: bucket.max,
        cumulativeCount,
        count,
      })
    }
  })

  // Calculate percentiles with linear interpolation within buckets
  const getPercentile = (percentile: number): number => {
    const targetCount = totalCalls * percentile

    for (let i = 0; i < distribution.length; i++) {
      const prevCumulativeCount = i > 0 ? distribution[i - 1].cumulativeCount : 0

      if (distribution[i].cumulativeCount >= targetCount) {
        // How far into this bucket is our target percentile?
        const positionInBucket = (targetCount - prevCumulativeCount) / distribution[i].count

        // Linear interpolation within the bucket range (log scale would be better for large ranges)
        const bucketMin = distribution[i].minValue
        const bucketMax = distribution[i].maxValue

        // Use log interpolation for better distribution across wide buckets
        const logMin = Math.log10(Math.max(bucketMin, 0.1))
        const logMax = Math.log10(bucketMax)
        const logValue = logMin + positionInBucket * (logMax - logMin)

        return Math.pow(10, logValue)
      }
    }

    // Return max of last bucket if we somehow get here
    return distribution[distribution.length - 1]?.maxValue || 0
  }

  const result = {
    p50: getPercentile(0.5),
    p75: getPercentile(0.75),
    p90: getPercentile(0.9),
    p95: getPercentile(0.95),
    p99: getPercentile(0.99),
    p99_9: getPercentile(0.999),
  }

  console.log('📊 Percentile calculation:', { respCalls, result })

  return result
}
