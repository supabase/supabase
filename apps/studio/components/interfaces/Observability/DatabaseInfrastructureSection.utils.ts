import type {
  InfraMonitoringMultiResponse,
  InfraMonitoringResponse,
} from 'data/analytics/infra-monitoring-query'

type NumericValue = string | number | undefined

/**
 * Parses a numeric value that can be a number, string, or undefined.
 * Returns 0 for invalid or missing values.
 */
export function parseNumericValue(val: NumericValue): number {
  if (typeof val === 'number') return val
  if (typeof val === 'string') return parseFloat(val) || 0
  return 0
}

type MetricData = {
  current: number
  max: number
}

type InfrastructureMetrics = {
  cpu: MetricData
  ram: MetricData
  disk: MetricData
}

export function parseInfrastructureMetrics(
  infraData: InfraMonitoringResponse | undefined
): InfrastructureMetrics | null {
  if (!infraData) {
    return null
  }

  const series = 'series' in infraData ? infraData.series : {}

  const cpuValue = parseNumericValue(series.avg_cpu_usage?.totalAverage)
  const ramValue = parseNumericValue(series.ram_usage?.totalAverage)
  const diskValue = parseNumericValue(series.disk_io_consumption?.totalAverage)

  return {
    cpu: {
      current: cpuValue,
      max: 100,
    },
    ram: {
      current: ramValue,
      max: 100,
    },
    disk: {
      current: diskValue,
      max: 100,
    },
  }
}

type ConnectionsData = {
  current: number
  max: number
}

type MaxConnectionsData = {
  maxConnections?: number
}

export function parseConnectionsData(
  infraData: InfraMonitoringResponse | undefined,
  maxConnectionsData: MaxConnectionsData | undefined
): ConnectionsData {
  if (!infraData) {
    return { current: 0, max: 0 }
  }

  const series = 'series' in infraData ? infraData.series : {}

  const currentVal = series.pg_stat_database_num_backends?.totalAverage
  const current = Math.round(parseNumericValue(currentVal))
  const max = maxConnectionsData?.maxConnections || 0

  return { current, max }
}
