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
  diskIo: MetricData
}

export type MemoryPressureLevel = 'Healthy' | 'Elevated' | 'Unhealthy'

export type MemoryPressureData = {
  level: MemoryPressureLevel
  ramUsedPercent: number
  cachePercent: number
  swapUsedMB: number
  totalRamMB: number
  swapPercent: number
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
  const diskSystemValue = parseNumericValue(series.disk_fs_used_system?.totalAverage)
  const diskWalValue = parseNumericValue(series.disk_fs_used_wal?.totalAverage)
  const diskDatabaseValue = parseNumericValue(series.pg_database_size?.totalAverage)
  const diskSizeValue = parseNumericValue(series.disk_fs_size?.totalAverage)
  const diskUsedValue = diskSystemValue + diskWalValue + diskDatabaseValue
  const diskUsageValue = diskSizeValue > 0 ? (diskUsedValue / diskSizeValue) * 100 : 0
  const diskIoValue = parseNumericValue(series.disk_io_consumption?.totalAverage)

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
      current: diskUsageValue,
      max: 100,
    },
    diskIo: {
      current: diskIoValue,
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

/**
 * IMPORTANT: If you change these thresholds, you MUST update the documentation at:
 * apps/docs/content/guides/telemetry/reports.mdx#memory-breakdown
 *
 * Calculates memory pressure based on swap usage with hybrid thresholds
 * Uses max(absolute MB, % of total RAM) to scale appropriately
 *
 * Thresholds:
 * - Healthy: swap < max(16MB, 0.1% RAM)
 * - Elevated: swap ≥ max(64MB, 1% RAM)
 * - Unhealthy: swap ≥ max(256MB, 3% RAM)
 */
export function parseMemoryPressure(
  infraData: InfraMonitoringResponse | undefined
): MemoryPressureData | null {
  if (!infraData) {
    return null
  }

  const series = 'series' in infraData ? infraData.series : {}

  // Get RAM usage breakdown
  const ramUsed = parseNumericValue(series.ram_usage_used?.totalAverage)
  const ramCache = parseNumericValue(series.ram_usage_cache_and_buffers?.totalAverage)
  const ramFree = parseNumericValue(series.ram_usage_free?.totalAverage)
  const swapUsedBytes = parseNumericValue(series.swap_usage?.totalAverage)

  const totalRam = ramUsed + ramCache + ramFree

  if (totalRam === 0) {
    return null
  }

  // Calculate percentages and swap in MB
  const ramUsedPercent = (ramUsed / totalRam) * 100
  const cachePercent = (ramCache / totalRam) * 100
  const swapUsedMB = swapUsedBytes / (1024 * 1024) // Convert bytes to MB
  const totalRamMB = totalRam / (1024 * 1024)

  // Hybrid thresholds: max(absolute MB, % of total RAM)
  const mediumThreshold = Math.max(64, totalRamMB * 0.01) // 64MB or 1% RAM
  const highThreshold = Math.max(256, totalRamMB * 0.03) // 256MB or 3% RAM

  // Determine pressure level based on swap usage
  let level: MemoryPressureLevel
  if (swapUsedMB >= highThreshold) {
    level = 'Unhealthy'
  } else if (swapUsedMB >= mediumThreshold) {
    level = 'Elevated'
  } else {
    level = 'Healthy'
  }

  // Calculate swap as percentage of total RAM
  const swapPercent = totalRamMB > 0 ? (swapUsedMB / totalRamMB) * 100 : 0

  return {
    level,
    ramUsedPercent,
    cachePercent,
    swapUsedMB,
    totalRamMB,
    swapPercent,
  }
}
