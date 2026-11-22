import { Card, CardContent } from 'ui'
import { ChartLine } from 'ui-patterns/Chart'

import {
  expandWarehouseChartSeries,
  getWarehouseChartPoints,
  getWarehouseSeriesRank,
  type WarehouseChartSeries,
} from './WarehouseMetricChart.utils'
import { getEmptyMessage } from './WarehouseMetricsReport.utils'
import { NoDataPlaceholder } from '@/components/ui/Charts/NoDataPlaceholder'
import type { WarehouseMetric } from '@/data/warehouse/warehouse-metrics-api-types'

export const WarehouseMetricChart = ({
  metric,
  title,
  description,
  unit,
  scale = 1,
  emptyMessage,
  series: inputSeries = [{ metric, label: title }],
}: {
  metric?: WarehouseMetric
  title: string
  description: string
  unit?: 'ms' | '/s'
  scale?: number
  emptyMessage?: string
  series?: WarehouseChartSeries[]
}) => {
  const allSeries = expandWarehouseChartSeries(inputSeries)
  const selectedSeries = [...allSeries]
    .sort((a, b) => getWarehouseSeriesRank(b) - getWarehouseSeriesRank(a))
    .slice(0, 12)
  const series = allSeries.filter((item) => selectedSeries.includes(item))

  const points = getWarehouseChartPoints(series, scale)
  const keys = series.map((_, index) => `value${index}`)
  const config = Object.fromEntries(
    series.map((item, index) => [
      keys[index],
      { label: item.label, color: `var(--chart-${(index % 8) + 1})` },
    ])
  )
  const hasValues = points.some((point) => keys.some((key) => typeof point[key] === 'number'))
  const hasUnavailableSeries = series.some(
    (item) =>
      !item.metric ||
      !['ok', 'partial'].includes(item.metric.availability) ||
      !item.metric.series.some((series) =>
        series.points.some((point) => point.value !== null && Number.isFinite(point.value))
      )
  )
  return (
    <section aria-label={title}>
      <Card>
        <CardContent className="flex flex-col gap-y-4 p-4">
          {hasValues ? (
            <>
              <h2 className="text-sm">{title}</h2>
              <p className="text-xs text-foreground-light">{description}</p>
              {series.length > 1 && (
                <ul
                  className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-light"
                  aria-label={`${title} series`}
                >
                  {series.map((item, index) => (
                    <li key={keys[index]} className="flex items-center gap-1.5">
                      <span
                        className="h-2 w-2 rounded-sm"
                        style={{ backgroundColor: `var(--chart-${(index % 8) + 1})` }}
                        aria-hidden="true"
                      />
                      {item.label}
                    </li>
                  ))}
                </ul>
              )}
              <ChartLine
                className="h-64"
                isFullHeight
                data={points}
                xKey="timestamp"
                dataKey={keys[0]}
                dataKeys={keys}
                config={config}
                color="var(--chart-1)"
                DateTimeFormat="MMM D, HH:mm"
                showHighlightArea={false}
                tooltipDetails={unit ? (_, __, value) => `${value}${unit}` : undefined}
              />
            </>
          ) : (
            <NoDataPlaceholder
              attribute={title}
              size="normal"
              hideTotalPlaceholder
              message={
                metric?.availability === 'no_data' && emptyMessage
                  ? emptyMessage
                  : getEmptyMessage(metric)
              }
            />
          )}
          {allSeries.length > series.length && (
            <p className="text-xs text-foreground-light">
              Showing {series.length} of {allSeries.length} series
            </p>
          )}
          {hasValues && series.some((item) => item.metric?.availability === 'partial') && (
            <p className="text-xs text-foreground-light">Partial data</p>
          )}
          {hasValues && hasUnavailableSeries && (
            <p className="text-xs text-foreground-light">Some measurements are unavailable</p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
