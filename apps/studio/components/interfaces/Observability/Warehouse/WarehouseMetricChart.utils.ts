import type { WarehouseMetric } from '@/data/warehouse/warehouse-metrics-api-types'

export type WarehouseChartSeries = { metric?: WarehouseMetric; label: string }

export const getWarehouseChartPoints = (series: WarehouseChartSeries[], scale: number) => {
  const rows = new Map<number, Record<string, string | number>>()
  series.forEach(({ metric }, index) => {
    if (metric?.series.length !== 1) return
    metric.series[0].points.forEach(({ timestamp, value }) => {
      const row = rows.get(timestamp) ?? { timestamp: new Date(timestamp * 1000).toISOString() }
      if (value !== null && Number.isFinite(value)) row[`value${index}`] = value * scale
      rows.set(timestamp, row)
    })
  })
  return [...rows.entries()].sort(([a], [b]) => a - b).map(([, row]) => row)
}
