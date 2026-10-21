import dayjs from 'dayjs'
import {
  Chart,
  ChartCard,
  ChartContent,
  ChartEmptyState,
  ChartHeader,
  ChartLine,
  ChartLoadingState,
  ChartTitle,
} from 'ui-patterns/Chart'

import { DashboardModel, MODEL_METRICS } from './model.schema'
import { getModelSeries } from './model.utils'
import { AlertError } from '@/components/ui/AlertError'
import { useInfraMonitoringAttributesQuery } from '@/data/analytics/infra-monitoring-query'

type ModelMetricPanelProps = {
  projectRef: string | undefined
  model: DashboardModel
  panel: DashboardModel['panels'][number]
}

export function ModelMetricPanel({ projectRef, model, panel }: ModelMetricPanelProps) {
  const metric = MODEL_METRICS[panel.metric]
  const query = useInfraMonitoringAttributesQuery({
    projectRef,
    attributes: [metric.attribute],
    startDate: model.start,
    endDate: model.end,
    interval: model.interval,
  })
  const response = query.data
  const metricError =
    response && 'errors' in response ? response.errors?.[metric.attribute] : undefined
  const hasMissingSeries = response && 'series' in response && !response.series[metric.attribute]
  const error =
    query.error ??
    metricError ??
    (hasMissingSeries ? { message: 'The response did not include this metric.' } : undefined)
  const displayError =
    error instanceof Error || (error && typeof error === 'object' && 'message' in error)
      ? { message: String(error.message) }
      : undefined
  const data = response ? getModelSeries(response, metric.attribute, model.start, model.end) : []
  const hasData = data.some(({ value }) => typeof value === 'number')
  const referenceLines = model.annotations.map(({ at }) => ({
    x: Date.parse(at),
    stroke: 'var(--chart-reference)',
  }))

  return (
    <Chart isLoading={query.isPending}>
      <ChartCard>
        <ChartHeader>
          <ChartTitle>{panel.title ?? metric.label}</ChartTitle>
        </ChartHeader>
        {panel.description && (
          <p className="px-6 pb-4 text-sm text-foreground-light whitespace-pre-wrap break-words">
            {panel.description}
          </p>
        )}
        {!!error && (
          <div className="p-6">
            <AlertError
              projectRef={projectRef}
              subject={`Failed to retrieve ${metric.label.toLowerCase()}`}
              error={displayError}
            />
          </div>
        )}
        {!error && (
          <ChartContent
            isEmpty={!hasData}
            emptyState={
              <ChartEmptyState
                title="No metric data"
                description="No samples are available for this time range. Try a recent example or check the project's metric retention."
              />
            }
            loadingState={<ChartLoadingState />}
          >
            <div className="h-56">
              <ChartLine
                data={data}
                dataKey="value"
                xKey="time"
                config={{ value: { label: metric.label } }}
                isFullHeight
                showGrid
                showXAxis
                showYAxis
                referenceLines={referenceLines}
                XAxisProps={{
                  type: 'number',
                  domain: [Date.parse(model.start), Date.parse(model.end)],
                  scale: 'time',
                  tickFormatter: (value: number) => dayjs(value).utc().format('HH:mm'),
                }}
                YAxisProps={{
                  tickFormatter: (value: number) => `${value}${metric.unit === '%' ? '%' : ''}`,
                }}
                tooltipDetails={(datum) =>
                  dayjs(datum.time).utc().format('YYYY-MM-DD HH:mm:ss [UTC]')
                }
              />
            </div>
          </ChartContent>
        )}
      </ChartCard>
    </Chart>
  )
}
