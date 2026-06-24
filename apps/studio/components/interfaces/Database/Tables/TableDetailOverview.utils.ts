import type { ChartConfig } from 'ui'

export type TableOverviewChartDatum = {
  timestamp: string
  row_count: number
  table_size_bytes: number
  column_count: number
}

export const TABLE_ROW_COUNT_CHART_CONFIG = {
  row_count: {
    label: 'Rows',
    color: 'hsl(var(--brand-default))',
  },
} satisfies ChartConfig

export const TABLE_SIZE_CHART_CONFIG = {
  table_size_bytes: {
    label: 'Size',
    color: 'hsl(var(--brand-default))',
  },
} satisfies ChartConfig

export const TABLE_COLUMN_COUNT_CHART_CONFIG = {
  column_count: {
    label: 'Columns',
    color: 'hsl(var(--brand-default))',
  },
} satisfies ChartConfig

const SPARKLINE_POINTS = 14
const DAY_MS = 24 * 60 * 60 * 1000

function pseudoNoise(seed: number, index: number) {
  return (((seed * 17 + index * 31) % 100) - 50) / 500
}

export function buildTableOverviewSparklineData({
  tableId,
  rowCount,
  sizeBytes,
  columnCount,
  now = Date.now(),
}: {
  tableId: number
  rowCount: number
  sizeBytes: number
  columnCount: number
  now?: number
}): TableOverviewChartDatum[] {
  const seed = tableId

  return Array.from({ length: SPARKLINE_POINTS }, (_, index) => {
    const daysAgo = SPARKLINE_POINTS - 1 - index
    const progress = index / Math.max(SPARKLINE_POINTS - 1, 1)
    const timestamp = new Date(now - daysAgo * DAY_MS).toISOString()

    const rowScale = 0.72 + progress * 0.28 + pseudoNoise(seed, index)
    const sizeScale = 0.78 + progress * 0.22 + pseudoNoise(seed + 7, index)
    const columnScale = 0.85 + progress * 0.15 + pseudoNoise(seed + 13, index) * 0.05

    return {
      timestamp,
      row_count: Math.max(0, Math.round(rowCount * rowScale)),
      table_size_bytes: Math.max(0, Math.round(sizeBytes * sizeScale)),
      column_count: Math.max(1, Math.round(columnCount * columnScale)),
    }
  })
}

const SIZE_UNIT_MULTIPLIERS: Record<string, number> = {
  bytes: 1,
  byte: 1,
  b: 1,
  kb: 1024,
  kib: 1024,
  mb: 1024 ** 2,
  mib: 1024 ** 2,
  gb: 1024 ** 3,
  gib: 1024 ** 3,
  tb: 1024 ** 4,
  tib: 1024 ** 4,
}

export function parseTableSizeLabelToBytes(size?: string): number {
  if (!size) return 0

  const match = size.trim().toLowerCase().match(/^([\d.]+)\s*([a-z]+)$/)
  if (!match) return 0

  const amount = Number.parseFloat(match[1])
  const unit = match[2]
  const multiplier = SIZE_UNIT_MULTIPLIERS[unit]

  if (!multiplier || Number.isNaN(amount)) return 0
  return Math.round(amount * multiplier)
}
