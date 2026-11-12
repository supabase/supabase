import dayjs from 'dayjs'
import { Button, Card, CardContent } from 'ui'

import type { WarehouseChartDef } from './WarehouseMetrics.constants'
import { buildWarehouseChartModel, type WarehouseChartAvailability } from './WarehouseMetrics.utils'
import type { Datum } from '@/components/ui/Charts/Charts.types'
import { ComposedChart } from '@/components/ui/Charts/ComposedChart'
import { useChartHighlight } from '@/components/ui/Charts/useChartHighlight'
import type { WarehouseMetricsData } from '@/data/warehouse/warehouse-metrics-query'

interface WarehouseMetricsChartProps {
  chart: WarehouseChartDef
  response: WarehouseMetricsData
  syncId: string
  updateDateRange: (from: string, to: string) => void
  onRetry: () => void
}

const getPlaceholder = (availability: WarehouseChartAvailability) => {
  switch (availability.status) {
    case 'insufficient_data':
      return { message: 'Not enough data yet', detail: undefined, canRetry: false }
    case 'unavailable':
      return { message: 'Metrics are temporarily unavailable', detail: undefined, canRetry: true }
    case 'stale':
      return {
        message: 'No recent data',
        detail: availability.lastSampleAt
          ? `Last sample ${dayjs(availability.lastSampleAt).fromNow()}`
          : undefined,
        canRetry: false,
      }
    default:
      return { message: 'No data in this time range', detail: undefined, canRetry: false }
  }
}

const getNotice = (availability: WarehouseChartAvailability) => {
  switch (availability.status) {
    case 'partial':
    case 'unavailable':
      return "Some series couldn't be loaded"
    case 'stale':
      return 'Some series have no recent data'
    default:
      return undefined
  }
}

export const WarehouseMetricsChart = ({
  chart,
  response,
  syncId,
  updateDateRange,
  onRetry,
}: WarehouseMetricsChartProps) => {
  const chartHighlight = useChartHighlight()
  const model = buildWarehouseChartModel(response, chart)

  if (!model.hasFiniteValues) {
    const { message, detail, canRetry } = getPlaceholder(model.availability)

    return (
      <Card>
        <CardContent className="flex min-h-[200px] flex-col gap-3 p-4">
          <h3 className="text-sm text-foreground-light">{chart.title}</h3>
          <div className="flex flex-1 flex-col items-center justify-center gap-1 text-center">
            <p className="text-sm text-foreground">{message}</p>
            {detail && <p className="text-xs text-foreground-lighter">{detail}</p>}
            {canRetry && (
              <Button variant="default" className="mt-2" onClick={onRetry}>
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const notice = getNotice(model.availability)
  const isCapped = model.shownSeries < model.totalSeries

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4">
        <ComposedChart
          // Rows hold null where the API had no value. ComposedChart's Datum type rejects null,
          // but it reads missing values as gaps at runtime, so the rows are passed through as-is.
          data={model.rows as Datum[]}
          attributes={model.attributes}
          xAxisKey="timestamp"
          yAxisKey={model.primaryKey ?? model.attributes[0].attribute}
          highlightedValue={model.latestValue}
          hideHighlightedValue={model.highlight === 'none'}
          format={chart.format}
          title={chart.title}
          titleTooltip={chart.tooltip}
          chartStyle="line"
          hideChartType
          showTotal={false}
          showLegend={model.attributes.length >= 2}
          showTooltip
          showMaxValue={model.attributes.some((attribute) => attribute.isMaxValue)}
          chartHighlight={chartHighlight}
          updateDateRange={updateDateRange}
          syncId={syncId}
        />
        {isCapped && (
          <p className="text-xs text-foreground-lighter">
            Showing top {model.shownSeries} of {model.totalSeries} series
          </p>
        )}
        {notice && <p className="text-xs text-foreground-lighter">{notice}</p>}
      </CardContent>
    </Card>
  )
}
