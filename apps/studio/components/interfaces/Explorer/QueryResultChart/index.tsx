'use client'

import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, cn, type ChartConfig } from 'ui'

import type { QueryResultChartConfig, QueryResultData } from '../ExplorerQuery/ExplorerQuery.types'

export type QueryResultChartProps = {
  data: QueryResultData
  config: QueryResultChartConfig
  ariaLabel?: string
  className?: string
}

const chartValueKey = 'queryValue'

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string' || value.trim() === '') return null

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

const formatYAxisTick = (value: number) =>
  new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(value)

/** Controlled chart renderer. Display configuration and persistence stay with the caller. */
const QueryResultChart = ({
  data,
  config,
  ariaLabel = 'Query results chart',
  className,
}: QueryResultChartProps) => {
  const columnKeys = useMemo(() => new Set(data.columns.map(({ key }) => key)), [data.columns])

  const chartData = useMemo(() => {
    let cumulativeValue = 0

    return data.rows.flatMap((row) => {
      const numericValue = toFiniteNumber(row[config.yKey])
      if (numericValue === null) return []

      cumulativeValue += numericValue
      return [
        {
          ...row,
          [chartValueKey]: config.cumulative ? cumulativeValue : numericValue,
        },
      ]
    })
  }, [config.cumulative, config.yKey, data.rows])

  const hasConfiguredColumns = columnKeys.has(config.xKey) && columnKeys.has(config.yKey)
  const yColumn = data.columns.find(({ key }) => key === config.yKey)
  const hasNonPositiveValues = chartData.some((row) => Number(row[chartValueKey]) <= 0)
  const useLogScale = !!config.logScale && !hasNonPositiveValues
  const color = config.color ?? 'hsl(var(--chart-1))'
  const showLabels = config.showLabels ?? true
  const chartConfig = {
    [chartValueKey]: {
      label: yColumn?.label ?? config.yKey,
      color,
    },
  } satisfies ChartConfig

  if (data.rows.length === 0) {
    return (
      <div
        data-slot="query-result-chart"
        role="status"
        className={cn('flex min-h-48 flex-1 items-center justify-center p-4', className)}
      >
        <p className="text-xs text-foreground-light">Success. No rows returned</p>
      </div>
    )
  }

  if (!hasConfiguredColumns) {
    return (
      <div
        data-slot="query-result-chart"
        role="status"
        className={cn('flex min-h-48 flex-1 items-center justify-center p-4', className)}
      >
        <p className="text-xs text-foreground-light">Select valid X and Y columns</p>
      </div>
    )
  }

  if (chartData.length === 0) {
    return (
      <div
        data-slot="query-result-chart"
        role="status"
        className={cn('flex min-h-48 flex-1 items-center justify-center p-4', className)}
      >
        <p className="text-xs text-foreground-light">The Y column must contain numeric values</p>
      </div>
    )
  }

  const commonChartProps = {
    accessibilityLayer: true,
    data: chartData,
    margin: { top: 12, right: 12, bottom: 4, left: 0 },
  }

  const cartesianGrid = config.showGrid ? <CartesianGrid vertical={false} /> : null
  const xAxis = (
    <XAxis
      dataKey={config.xKey}
      axisLine={false}
      tickLine={false}
      tick={showLabels}
      tickMargin={8}
      minTickGap={24}
    />
  )
  const yAxis = (
    <YAxis
      axisLine={false}
      tickLine={false}
      tick={showLabels}
      tickMargin={8}
      scale={useLogScale ? 'log' : 'auto'}
      domain={useLogScale ? [1, 'auto'] : undefined}
      allowDataOverflow={useLogScale}
      tickFormatter={formatYAxisTick}
    />
  )
  const tooltip = <ChartTooltip content={<ChartTooltipContent />} />

  return (
    <div
      data-slot="query-result-chart"
      className={cn('flex min-h-48 w-full flex-1 flex-col overflow-hidden', className)}
    >
      {config.logScale && hasNonPositiveValues && (
        <p className="shrink-0 px-3 pt-2 text-xs text-foreground-light">
          Log scale is unavailable because the data contains zero or negative values.
        </p>
      )}
      <ChartContainer
        aria-label={ariaLabel}
        className="min-h-48 flex-1 aspect-auto px-3 py-2"
        config={chartConfig}
      >
        {config.type === 'line' ? (
          <LineChart {...commonChartProps}>
            {cartesianGrid}
            {xAxis}
            {yAxis}
            {tooltip}
            <Line
              dataKey={chartValueKey}
              type="monotone"
              stroke={`var(--color-${chartValueKey})`}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        ) : (
          <BarChart {...commonChartProps}>
            {cartesianGrid}
            {xAxis}
            {yAxis}
            {tooltip}
            <Bar dataKey={chartValueKey} fill={`var(--color-${chartValueKey})`} radius={4} />
          </BarChart>
        )}
      </ChartContainer>
    </div>
  )
}
QueryResultChart.displayName = 'QueryResultChart'

export { QueryResultChart }
