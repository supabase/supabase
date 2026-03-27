import type {
  InfraMonitoringResponse,
  InfraMonitoringSeriesMetadata,
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

function hasTotalAverage(meta: InfraMonitoringSeriesMetadata | undefined): boolean {
  if (!meta) return false
  const t = meta.totalAverage
  if (t === undefined || t === null) return false
  if (typeof t === 'string' && t.trim() === '') return false
  return true
}

/**
 * Prefer API `totalAverage`; if absent, average numeric points from `data` (hourly buckets).
 */
function getSeriesValue(
  infraData: InfraMonitoringResponse,
  series: Record<string, InfraMonitoringSeriesMetadata>,
  key: string
): number {
  const meta = series[key]
  if (meta && hasTotalAverage(meta)) {
    return parseNumericValue(meta.totalAverage)
  }

  if (!('data' in infraData) || !Array.isArray(infraData.data) || infraData.data.length === 0) {
    return 0
  }

  const samples: number[] = []
  for (const point of infraData.data) {
    let raw: NumericValue
    const valuesBag = 'values' in point ? point.values : undefined
    if (
      valuesBag !== undefined &&
      typeof valuesBag === 'object' &&
      valuesBag !== null &&
      key in valuesBag
    ) {
      raw = (valuesBag as Record<string, NumericValue>)[key]
    } else if (key in point) {
      raw = (point as Record<string, NumericValue>)[key]
    } else continue
    samples.push(parseNumericValue(raw))
  }
  if (samples.length === 0) return 0
  return samples.reduce((a, b) => a + b, 0) / samples.length
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

export function parseInfrastructureMetrics(
  infraData: InfraMonitoringResponse | undefined
): InfrastructureMetrics | null {
  if (!infraData) {
    return null
  }

  const series = 'series' in infraData && infraData.series ? infraData.series : {}

  const cpuValue = getSeriesValue(infraData, series, 'avg_cpu_usage')
  const ramValue = getSeriesValue(infraData, series, 'ram_usage')
  const diskSystemValue = getSeriesValue(infraData, series, 'disk_fs_used_system')
  const diskWalValue = getSeriesValue(infraData, series, 'disk_fs_used_wal')
  const diskDatabaseValue = getSeriesValue(infraData, series, 'pg_database_size')
  const diskSizeValue = getSeriesValue(infraData, series, 'disk_fs_size')
  const diskUsedValue = diskSystemValue + diskWalValue + diskDatabaseValue
  const diskUsageValue = diskSizeValue > 0 ? (diskUsedValue / diskSizeValue) * 100 : 0
  const diskIoValue = getSeriesValue(infraData, series, 'disk_io_consumption')

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

  const series = 'series' in infraData && infraData.series ? infraData.series : {}

  const avgBackends = getSeriesValue(infraData, series, 'pg_stat_database_num_backends')
  const current = Math.round(avgBackends)
  const max = maxConnectionsData?.maxConnections || 0

  return { current, max }
}

const DEMO_INFRASTRUCTURE_METRICS: InfrastructureMetrics = {
  cpu: { current: 41, max: 100 },
  ram: { current: 55, max: 100 },
  disk: { current: 48, max: 100 },
  diskIo: { current: 18, max: 100 },
}

/**
 * When the observ API returns no rows and everything parses to zero, use plausible demo numbers
 * so Studio demos and local dev still show a meaningful health story.
 */
export function applyDemoInfrastructureIfUnreliable(
  infraData: InfraMonitoringResponse | undefined,
  metrics: InfrastructureMetrics | null,
  connections: ConnectionsData
): { metrics: InfrastructureMetrics; connections: ConnectionsData; isDemo: boolean } {
  const parsedOrZero: InfrastructureMetrics = metrics ?? {
    cpu: { current: 0, max: 100 },
    ram: { current: 0, max: 100 },
    disk: { current: 0, max: 100 },
    diskIo: { current: 0, max: 100 },
  }

  const hasRows =
    !!infraData && 'data' in infraData && Array.isArray(infraData.data) && infraData.data.length > 0

  const allZero =
    parsedOrZero.cpu.current === 0 &&
    parsedOrZero.ram.current === 0 &&
    parsedOrZero.disk.current === 0 &&
    parsedOrZero.diskIo.current === 0

  const connectionsEmpty = connections.max === 0 && connections.current === 0

  const looksUnreliable =
    !infraData || (!hasRows && allZero && (connectionsEmpty || connections.current === 0))

  if (!looksUnreliable) {
    return { metrics: parsedOrZero, connections, isDemo: false }
  }

  const demoConnections: ConnectionsData =
    connections.max > 0
      ? {
          current: Math.min(
            Math.max(1, connections.max - 8),
            Math.round(connections.max * 0.71)
          ),
          max: connections.max,
        }
      : { current: 58, max: 100 }

  return {
    metrics: DEMO_INFRASTRUCTURE_METRICS,
    connections: demoConnections,
    isDemo: true,
  }
}
