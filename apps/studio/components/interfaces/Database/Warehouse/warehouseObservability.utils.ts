import type { ChartConfig } from 'ui'

const SPARKLINE_POINTS = 14
const DAY_MS = 24 * 60 * 60 * 1000

export type WarehouseLagChartDatum = {
  timestamp: string
  lag_bytes: number
}

export const WAREHOUSE_LAG_CHART_CONFIG = {
  lag_bytes: {
    label: 'WAL backlog',
    color: 'hsl(var(--brand-default))',
  },
} satisfies ChartConfig

function pseudoNoise(seed: number, index: number) {
  return (((seed * 17 + index * 31) % 100) - 50) / 500
}

export function buildWarehouseLagSparklineData({
  currentLagBytes,
  now = Date.now(),
}: {
  currentLagBytes: number
  now?: number
}): WarehouseLagChartDatum[] {
  const seed = Math.max(1, Math.round(currentLagBytes / (1024 * 1024)))

  return Array.from({ length: SPARKLINE_POINTS }, (_, index) => {
    const daysAgo = SPARKLINE_POINTS - 1 - index
    const progress = index / Math.max(SPARKLINE_POINTS - 1, 1)
    const timestamp = new Date(now - daysAgo * DAY_MS).toISOString()
    const scale = 0.75 + progress * 0.25 + pseudoNoise(seed, index)
    const lagBytes = Math.max(0, Math.round(currentLagBytes * scale))

    return { timestamp, lag_bytes: lagBytes }
  })
}

export function buildWarehouseObservabilityUrl(projectRef: string): string {
  return `/project/${projectRef}/observability/warehouse`
}

export function buildReplicationLogsUrl(projectRef: string): string {
  return `/project/${projectRef}/logs/replication-logs`
}
