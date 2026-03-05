import { QueryPerformanceRow, ChartDataPoint, ParsedLogEntry } from '../QueryPerformance.types'

export function parseSupamonitorLogs(logData: any[]): ParsedLogEntry[] {
  if (!logData || logData.length === 0) return []

  return logData.map((log) => ({
    timestamp: log.timestamp,
    application_name: log.application_name,
    calls: log.calls,
    database_name: log.database_name,
    query: log.query,
    query_id: log.query_id,
    total_exec_time: log.total_exec_time,
    total_plan_time: log.total_plan_time,
    user_name: log.user_name,
    mean_exec_time: log.mean_exec_time,
    mean_plan_time: log.mean_plan_time,
    min_exec_time: log.min_exec_time,
    max_exec_time: log.max_exec_time,
    min_plan_time: log.min_plan_time,
    max_plan_time: log.max_plan_time,
    p50_exec_time: log.p50_exec_time,
    p95_exec_time: log.p95_exec_time,
    p50_plan_time: log.p50_plan_time,
    p95_plan_time: log.p95_plan_time,
  }))
}

export function transformLogsToChartData(parsedLogs: ParsedLogEntry[]): ChartDataPoint[] {
  if (!parsedLogs || parsedLogs.length === 0) return []

  return parsedLogs
    .map((log: ParsedLogEntry) => {
      if (!log.timestamp) return null

      const periodStart = new Date(log.timestamp).getTime()
      if (isNaN(periodStart)) return null

      const meanExecTime = parseFloat(String(log.mean_exec_time ?? 0))
      const meanPlanTime = parseFloat(String(log.mean_plan_time ?? 0))
      const calls = parseInt(String(log.calls ?? 0), 10)

      return {
        period_start: periodStart,
        timestamp: log.timestamp,
        query_latency: meanExecTime + meanPlanTime,
        mean_time: meanExecTime,
        min_time: (log.min_exec_time ?? 0) + (log.min_plan_time ?? 0),
        max_time: (log.max_exec_time ?? 0) + (log.max_plan_time ?? 0),
        stddev_time: 0,
        p50_time: (log.p50_exec_time ?? 0) + (log.p50_plan_time ?? 0),
        p95_time: (log.p95_exec_time ?? 0) + (log.p95_plan_time ?? 0),
        rows_read: 0,
        calls,
        cache_hits: 0,
        cache_misses: 0,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.period_start - b.period_start)
}

function normalizeQuery(query: string): string {
  return query.replace(/\s+/g, ' ').trim()
}

export function aggregateLogsByQuery(parsedLogs: ParsedLogEntry[]): QueryPerformanceRow[] {
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
    let totalExecTime = 0
    let totalPlanTime = 0
    let minTime = Infinity
    let maxTime = -Infinity
    const rolname = logs[0]?.user_name || ''
    const applicationName = logs[0]?.application_name || ''

    logs.forEach((log) => {
      const logCalls = parseInt(String(log.calls ?? 0), 10)
      totalCalls += logCalls
      totalExecTime += parseFloat(String(log.total_exec_time ?? 0))
      totalPlanTime += parseFloat(String(log.total_plan_time ?? 0))
      minTime = Math.min(minTime, (log.min_exec_time ?? 0) + (log.min_plan_time ?? 0))
      maxTime = Math.max(maxTime, (log.max_exec_time ?? 0) + (log.max_plan_time ?? 0))
    })

    const totalTime = totalExecTime + totalPlanTime
    const avgMeanTime = totalCalls > 0 ? totalTime / totalCalls : 0
    const finalMinTime = minTime === Infinity ? 0 : minTime
    const finalMaxTime = maxTime === -Infinity ? 0 : maxTime

    totalExecutionTime += totalTime

    return {
      query,
      rolname,
      applicationName,
      count,
      avgMeanTime,
      minTime: finalMinTime,
      maxTime: finalMaxTime,
      totalCalls,
      totalTime,
    }
  })

  queryStats.forEach((stats) => {
    const propTotalTime = totalExecutionTime > 0 ? (stats.totalTime / totalExecutionTime) * 100 : 0

    aggregatedData.push({
      query: stats.query,
      rolname: stats.rolname,
      application_name: stats.applicationName,
      calls: stats.totalCalls,
      mean_time: stats.avgMeanTime,
      min_time: stats.minTime,
      max_time: stats.maxTime,
      total_time: stats.totalTime,
      rows_read: 0,
      cache_hit_rate: 0,
      prop_total_time: propTotalTime,
      index_advisor_result: null,
      _total_cache_hits: 0,
      _total_cache_misses: 0,
      _count: stats.count,
    })
  })

  return aggregatedData.sort((a, b) => b.total_time - a.total_time)
}
