import type { InfraMonitoringResponse } from '@/data/analytics/infra-monitoring-query'

export type UsageMetricStatus = 'default' | 'warning' | 'negative'

export type ComputeUsageChartDatum = {
  timestamp: string
  maxCpuUsage: number
  ramUsage: number
  diskIoConsumption: number
}

export type DiskUsageChartDatum = {
  timestamp: string
  databaseBytes: number
  walBytes: number
  systemBytes: number
  diskSizeBytes: number
  databaseUsagePercent: number
  walUsagePercent: number
  systemUsagePercent: number
}

/** Coerces an API value (string | number | undefined) into a finite number, defaulting to 0. */
export const toNumber = (value: string | number | undefined) => {
  const parsedValue = Number(value)
  return Number.isFinite(parsedValue) ? parsedValue : 0
}

/** Constrains a percentage to the [0, 100] range so charts never overflow their axis. */
export const clampPercentage = (value: number) => Math.min(Math.max(value, 0), 100)

export const formatUsagePercent = (value: number | undefined) =>
  value === undefined ? '—' : `${value.toFixed(0)}%`

export const getUsageMetricStatus = (value: number | undefined): UsageMetricStatus => {
  if (value === undefined) return 'default'
  if (value >= 90) return 'negative'
  if (value >= 75) return 'warning'
  return 'default'
}

export const getWorstUsageMetricStatus = (
  ...values: Array<number | undefined>
): UsageMetricStatus => {
  const statuses = values.map(getUsageMetricStatus)
  if (statuses.includes('negative')) return 'negative'
  if (statuses.includes('warning')) return 'warning'
  return 'default'
}

/** Returns the highest numeric value for a given key across all data points, or undefined when empty. */
export const getPeakChartValue = <T extends Record<string, unknown>>(
  data: T[],
  dataKey: keyof T
): number | undefined => {
  const values = data
    .map((point) => point[dataKey] as unknown)
    .filter((value): value is number => typeof value === 'number')

  if (values.length === 0) return undefined

  return Math.max(...values)
}

/**
 * Transforms a raw infra-monitoring response into the compute and disk chart series.
 * Disk points without a known disk size are dropped so usage percentages stay meaningful.
 */
export const buildUsageChartData = (
  usageData: InfraMonitoringResponse | undefined
): { computeChartData: ComputeUsageChartDatum[]; diskChartData: DiskUsageChartDatum[] } => {
  if (!usageData || !('series' in usageData)) {
    return { computeChartData: [], diskChartData: [] }
  }

  const computeChartData = usageData.data.map((point) => ({
    timestamp: point.period_start,
    maxCpuUsage: clampPercentage(toNumber(point.values.max_cpu_usage)),
    ramUsage: clampPercentage(toNumber(point.values.ram_usage)),
    diskIoConsumption: clampPercentage(toNumber(point.values.disk_io_consumption)),
  }))

  const diskChartData = usageData.data.flatMap((point) => {
    const databaseBytes = toNumber(point.values.pg_database_size)
    const walBytes = toNumber(point.values.disk_fs_used_wal)
    const systemBytes = toNumber(point.values.disk_fs_used_system)
    const totalBytes = toNumber(point.values.disk_fs_size)
    if (totalBytes <= 0) return []

    return {
      timestamp: point.period_start,
      databaseBytes,
      walBytes,
      systemBytes,
      diskSizeBytes: totalBytes,
      databaseUsagePercent: clampPercentage((databaseBytes / totalBytes) * 100),
      walUsagePercent: clampPercentage((walBytes / totalBytes) * 100),
      systemUsagePercent: clampPercentage((systemBytes / totalBytes) * 100),
    }
  })

  return { computeChartData, diskChartData }
}

/** Derives the peak CPU/memory/disk-IO values and the worst-case status for the compute card. */
export const getComputeUsageSummary = (data: ComputeUsageChartDatum[]) => {
  const peakCpuUsage = getPeakChartValue(data, 'maxCpuUsage')
  const peakMemoryUsage = getPeakChartValue(data, 'ramUsage')
  const peakDiskIoUsage = getPeakChartValue(data, 'diskIoConsumption')

  const peaks = [peakCpuUsage, peakMemoryUsage, peakDiskIoUsage].filter(
    (value): value is number => value !== undefined
  )
  const peakComputeUsage = peaks.length > 0 ? Math.max(...peaks) : undefined

  return {
    peakCpuUsage,
    peakMemoryUsage,
    peakDiskIoUsage,
    peakComputeUsage,
    status: getWorstUsageMetricStatus(peakCpuUsage, peakMemoryUsage, peakDiskIoUsage),
  }
}

/** Derives the latest used/total bytes, overall usage percentage, and status for the disk card. */
export const getDiskUsageSummary = (data: DiskUsageChartDatum[]) => {
  const latestDataPoint = data[data.length - 1]

  const usedBytes =
    (latestDataPoint?.databaseBytes ?? 0) +
    (latestDataPoint?.walBytes ?? 0) +
    (latestDataPoint?.systemBytes ?? 0)
  const sizeBytes = latestDataPoint?.diskSizeBytes ?? 0
  const usagePercent = sizeBytes > 0 ? clampPercentage((usedBytes / sizeBytes) * 100) : undefined

  return {
    latestDataPoint,
    usedBytes,
    sizeBytes,
    usagePercent,
    status: getUsageMetricStatus(usagePercent),
  }
}
