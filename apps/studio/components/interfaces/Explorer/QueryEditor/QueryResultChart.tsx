import { useMemo } from 'react'
import { type ChartConfig as ChartSeriesConfig } from 'ui'
import { Chart, ChartBar, ChartCard, ChartContent, ChartLine } from 'ui-patterns/Chart'

import { type QueryResult } from '../types'
import NoDataPlaceholder from '@/components/ui/Charts/NoDataPlaceholder'
import { formatLogTick, getCumulativeResults } from '@/components/ui/QueryBlock/QueryBlock.utils'
import { type ChartConfig } from '@/data/content/notebooks/notebook-schema'

interface QueryResultChartProps {
  chart?: ChartConfig
  result?: QueryResult
}

const Y_SERIES_COLORS = [
  'hsl(var(--brand-default))',
  'hsl(var(--chart-blue))',
  'hsl(var(--chart-3))',
]

const toChartValue = (value: unknown): string | number => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  return String(value)
}

export const QueryResultChart = ({ chart, result }: QueryResultChartProps) => {
  const { type, x_column, y_series = [], cumulative, show_labels, scale } = chart ?? {}

  const hasConfig = !!x_column && y_series.length > 0
  // Logarithmic scale only makes sense for a single series — DisplaySettingsButton
  // resets `scale` to linear once a second Y column is added
  const effectiveScale = y_series.length > 1 ? 'linear' : scale

  const chartConfig: ChartSeriesConfig = useMemo(
    () =>
      y_series.reduce((acc, key, index) => {
        acc[key] = { label: key, color: Y_SERIES_COLORS[index] }
        return acc
      }, {} as ChartSeriesConfig),
    [y_series]
  )

  const chartRows = useMemo(() => {
    const xKey = x_column ?? ''
    return (result?.rows ?? []).map((row) => {
      const chartRow: Record<string, string | number> = { [xKey]: toChartValue(row[xKey]) }
      y_series.forEach((yKey) => {
        chartRow[yKey] = toChartValue(row[yKey])
      })
      return chartRow
    })
  }, [result, x_column, y_series])

  const cumulativeResults = useMemo(
    () => getCumulativeResults({ rows: chartRows }, { yKey: y_series }),
    [chartRows, y_series]
  )
  const resultToRender = cumulative ? cumulativeResults : chartRows

  if (!result || (result?.rows && result.rows.length === 0)) {
    return (
      <NoDataPlaceholder
        isFullHeight
        className="border-0"
        size="normal"
        message="No results"
        description="Your query returned no rows"
      />
    )
  }

  if (!hasConfig) {
    return (
      <NoDataPlaceholder
        isFullHeight
        className="border-0"
        size="normal"
        message="Configure your chart"
        description="Select your X and Y axis in the display settings"
      />
    )
  }

  return (
    <Chart className="flex flex-grow min-h-0">
      <ChartCard className="flex flex-grow rounded-none border-0 min-h-0">
        <ChartContent className="min-h-0 w-full">
          {type === 'bar' && (
            <ChartBar
              isFullHeight
              xKey={x_column}
              dataKey={y_series[0]}
              dataKeys={y_series}
              config={chartConfig}
              showXAxis={show_labels}
              showYAxis={show_labels}
              data={resultToRender}
              YAxisProps={{
                scale: effectiveScale === 'log' ? 'log' : 'auto',
                domain: effectiveScale === 'log' ? [1, 'auto'] : undefined,
                tickFormatter: effectiveScale === 'log' ? formatLogTick : undefined,
              }}
            />
          )}
          {type === 'line' && (
            <ChartLine
              isFullHeight
              xKey={x_column}
              dataKey={y_series[0]}
              dataKeys={y_series}
              config={chartConfig}
              showXAxis={show_labels}
              showYAxis={show_labels}
              data={resultToRender}
              YAxisProps={{
                scale: effectiveScale === 'log' ? 'log' : 'auto',
                domain: effectiveScale === 'log' ? [1, 'auto'] : undefined,
                tickFormatter: effectiveScale === 'log' ? formatLogTick : undefined,
              }}
            />
          )}
        </ChartContent>
      </ChartCard>
    </Chart>
  )
}
