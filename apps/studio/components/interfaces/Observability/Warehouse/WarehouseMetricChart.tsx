import { Card, CardContent } from 'ui'
import { ChartLine } from 'ui-patterns/Chart'

import { getEmptyMessage } from './WarehouseMetricsReport.utils'
import { NoDataPlaceholder } from '@/components/ui/Charts/NoDataPlaceholder'
import type { WarehouseMetric } from '@/data/warehouse/warehouse-metrics-api-types'

export const WarehouseMetricChart = ({
  metric,
  title,
  description,
  unit,
  scale = 1,
}: {
  metric?: WarehouseMetric
  title: string
  description: string
  unit: string
  scale?: number
}) => {
  const points =
    metric?.series.length === 1
      ? metric.series[0].points.map((point): Record<string, string | number> => {
          const row: Record<string, string | number> = {
            timestamp: new Date(point.timestamp * 1000).toISOString(),
          }
          if (point.value !== null && Number.isFinite(point.value)) row.value = point.value * scale
          return row
        })
      : []
  const hasValues = points.some((point) => typeof point.value === 'number')
  return (
    <section aria-label={title}>
      <Card>
        <CardContent className="space-y-4 p-4">
          {hasValues ? (
            <>
              <h2 className="text-sm">{title}</h2>
              <p className="text-xs text-foreground-light">{description}</p>
              <ChartLine
                className="h-64"
                isFullHeight
                data={points}
                xKey="timestamp"
                dataKey="value"
                config={{ value: { label: `${title}${unit}`, color: 'var(--chart-1)' } }}
                color="var(--chart-1)"
                DateTimeFormat="MMM D, HH:mm"
                showHighlightArea={false}
                tooltipDetails={(_, __, value) => `${value}${unit}`}
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
          {hasValues && metric?.availability === 'partial' && (
            <p className="text-xs text-foreground-light">Partial data</p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
