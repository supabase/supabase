import { useMemo } from 'react'
import { cn, type ChartConfig as ChartSeriesConfig } from 'ui'
import { Chart, ChartBar, ChartCard, ChartContent, ChartLine } from 'ui-patterns/Chart'

import { type QueryResult } from '../types'
import NoDataPlaceholder from '@/components/ui/Charts/NoDataPlaceholder'
import {
  computeYAxisWidth,
  formatLogTick,
  formatYAxisTick,
  getCumulativeResults,
} from '@/components/ui/QueryBlock/QueryBlock.utils'
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

/**
 * Y series are keyed by position rather than by the column name they came from.
 *
 * `ChartContainer` writes every config key into a `<style>` element as
 * `--color-<key>`, and rrweb records `<style>` text verbatim: its text-node serializer
 * skips masking whenever the parent is a `STYLE` element, so neither `maskTextFn` nor
 * `maskAttributeFn` sees it. Keying by column name would therefore put the customer's own
 * column names into a recording. The name still reaches the chart as `label`, which
 * renders as text and is masked.
 *
 * The X column keeps its own name. Only config keys reach the `<style>`, and the X column
 * is never a config key, so renaming it buys nothing. It also costs something: ChartBar
 * and ChartLine branch on `xKey === 'timestamp'` to format tooltip dates and render the
 * date-range footer.
 */
const seriesKeyFor = (index: number) => `series_${index}`

/**
 * Guards the one collision the positional keys introduce: an X column literally named
 * `series_0`. Appends underscores until the X key is distinct from every series key.
 */
export function xKeyFor(xColumn: string, seriesKeys: string[]): string {
  let key = xColumn
  while (seriesKeys.includes(key)) key = `${key}_`
  return key
}

export const QueryResultChart = ({ chart, result }: QueryResultChartProps) => {
  const { type, x_column, y_series = [], cumulative, show_labels, scale } = chart ?? {}

  const hasConfig = !!x_column && y_series.length > 0
  // Logarithmic scale only makes sense for a single series — DisplaySettingsButton
  // resets `scale` to linear once a second Y column is added
  const effectiveScale = y_series.length > 1 ? 'linear' : scale

  const seriesKeys = useMemo(() => y_series.map((_, index) => seriesKeyFor(index)), [y_series])

  const chartConfig: ChartSeriesConfig = useMemo(
    () =>
      y_series.reduce((acc, column, index) => {
        acc[seriesKeyFor(index)] = { label: column, color: Y_SERIES_COLORS[index] }
        return acc
      }, {} as ChartSeriesConfig),
    [y_series]
  )

  const xKey = useMemo(() => xKeyFor(x_column ?? '', seriesKeys), [x_column, seriesKeys])

  const chartRows = useMemo(() => {
    const sourceColumn = x_column ?? ''
    return (result?.rows ?? []).map((row) => {
      const chartRow: Record<string, string | number> = { [xKey]: toChartValue(row[sourceColumn]) }
      y_series.forEach((column, index) => {
        chartRow[seriesKeyFor(index)] = toChartValue(row[column])
      })
      return chartRow
    })
  }, [result, x_column, xKey, y_series])

  const cumulativeResults = useMemo(
    () => getCumulativeResults({ rows: chartRows }, { yKey: seriesKeys }),
    [chartRows, seriesKeys]
  )
  const resultToRender = cumulative ? cumulativeResults : chartRows

  const yAxisWidth = Math.max(
    36,
    ...seriesKeys.map((key) =>
      computeYAxisWidth(resultToRender, key, { isLogScale: effectiveScale === 'log' })
    )
  )

  const yAxisProps = {
    ...(show_labels ? { width: yAxisWidth } : {}),
    scale: effectiveScale === 'log' ? 'log' : 'auto',
    domain: effectiveScale === 'log' ? ([1, 'auto'] as const) : undefined,
    tickFormatter: effectiveScale === 'log' ? formatLogTick : formatYAxisTick,
  }

  if (!result || (result?.rows && result.rows.length === 0)) {
    return (
      <NoDataPlaceholder
        className="border-0 min-h-0! py-8"
        size="normal"
        message="No results"
        description="Your query returned no rows"
      />
    )
  }

  if (!hasConfig) {
    return (
      <NoDataPlaceholder
        className="border-0 min-h-0! py-8"
        size="normal"
        message="Configure your chart"
        description="Select your X and Y axis in the display settings"
      />
    )
  }

  return (
    <Chart className="flex flex-grow min-h-0">
      <ChartCard className="flex flex-grow rounded-none border-0 min-h-0">
        <ChartContent className={cn('min-h-0 h-full w-full', show_labels && 'pl-2 pb-2')}>
          {type === 'bar' && (
            <ChartBar
              isFullHeight
              xKey={xKey}
              dataKey={seriesKeys[0]}
              dataKeys={seriesKeys}
              config={chartConfig}
              showXAxis={show_labels}
              showYAxis={show_labels}
              data={resultToRender}
              YAxisProps={yAxisProps}
            />
          )}
          {type === 'line' && (
            <ChartLine
              isFullHeight
              xKey={xKey}
              dataKey={seriesKeys[0]}
              dataKeys={seriesKeys}
              config={chartConfig}
              showXAxis={show_labels}
              showYAxis={show_labels}
              data={resultToRender}
              YAxisProps={yAxisProps}
            />
          )}
        </ChartContent>
      </ChartCard>
    </Chart>
  )
}
