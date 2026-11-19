import type { WarehouseMetric } from '@/data/warehouse/warehouse-metrics-api-types'

export type WarehouseChartSeries = { metric?: WarehouseMetric; label: string }

const getLabelKey = (labels: Record<string, string>) =>
  Object.keys(labels)
    .sort()
    .map((key) => `${key}=${labels[key]}`)
    .join('|')

export const expandWarehouseChartSeries = (series: WarehouseChartSeries[]) =>
  series.flatMap(({ metric, label }) => {
    if (!metric || metric.series.length === 0) return [{ metric, label }]
    return [...metric.series]
      .sort((a, b) => getLabelKey(a.labels).localeCompare(getLabelKey(b.labels)))
      .map((item) => ({
        metric: { ...metric, series: [item] },
        label: [
          label,
          ...Object.keys(item.labels)
            .sort()
            .map((key) => item.labels[key]),
        ]
          .filter(Boolean)
          .join(' · '),
      }))
  })

export const getWarehouseSeriesRank = ({ metric }: WarehouseChartSeries) => {
  const points = metric?.series.flatMap((series) => series.points) ?? []
  const measuredPoints = points.filter(
    (point) => point.value !== null && Number.isFinite(point.value)
  )
  if (measuredPoints.some((point) => point.value !== 0)) return 2
  return measuredPoints.length > 0 ? 1 : 0
}

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
