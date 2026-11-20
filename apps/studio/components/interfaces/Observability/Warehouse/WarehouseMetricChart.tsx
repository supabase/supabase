import { Card, CardContent } from 'ui'
import { ChartLine } from 'ui-patterns/Chart'

import { getWarehouseChartPoints, type WarehouseChartSeries } from './WarehouseMetricChart.utils'
import { getEmptyMessage } from './WarehouseMetricsReport.utils'
import { NoDataPlaceholder } from '@/components/ui/Charts/NoDataPlaceholder'
import type { WarehouseMetric } from '@/data/warehouse/warehouse-metrics-api-types'

export const WarehouseMetricChart = ({
  metric,
  title,
  description,
  unit,
  scale = 1,
  series = [{ metric, label: title }],
}: {
  metric?: WarehouseMetric
  title: string
  description: string
  unit: string
  scale?: number
  series?: WarehouseChartSeries[]
}) => {
  const points = getWarehouseChartPoints(series, scale)
  const keys = series.map((_, index) => `value${index}`)
  const config = Object.fromEntries(
    series.map((item, index) => [
      keys[index],
      { label: item.label, color: `var(--chart-${index + 1})` },
    ])
  )
  const hasValues = points.some((point) => keys.some((key) => typeof point[key] === 'number'))
  const hasUnavailableSeries = series.some(
    (item) => !item.metric || !['ok', 'partial'].includes(item.metric.availability)
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
                <p className="text-xs text-foreground-light">
                  {series.map((item) => item.label).join(' · ')}
                </p>
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
                tooltipDetails={(_, __, value) => `${value}${unit ? ` ${unit}` : ''}`}
              />
            </>
          ) : (
            <NoDataPlaceholder
              attribute={title}
              size="normal"
              hideTotalPlaceholder
              message={getEmptyMessage(metric)}
            />
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
