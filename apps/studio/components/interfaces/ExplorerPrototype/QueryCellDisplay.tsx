/**
 * PROTOTYPE — the `QueryDisplay` renderer (PR E5).
 *
 * Two capabilities here that today's QueryBlock does not have, and which the
 * spec's `ChartDisplay` requires: **multi-series** (`series[]` with per-series
 * labels) and **line charts** (declared but unimplemented in QueryBlock today).
 */

import dayjs from 'dayjs'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer, ChartTooltipContent, cn } from 'ui'

import { CHART_SERIES_COLORS } from './chartColors'
import type { ChartDisplay, QueryDisplay, ResultRow } from './ExplorerPrototype.types'
import { Results } from '@/components/interfaces/SQLEditor/UtilityPanel/Results'
import { CHART_COLORS } from '@/components/ui/Charts/Charts.constants'

/** Running total per series, computed independently for each field. */
export const applyCumulative = (rows: ResultRow[], fields: string[]): ResultRow[] => {
  const totals: Record<string, number> = {}
  return rows.map((row) => {
    const next: ResultRow = { ...row }
    fields.forEach((field) => {
      totals[field] = (totals[field] ?? 0) + Number(row[field] ?? 0)
      next[field] = totals[field]
    })
    return next
  })
}

const looksLikeDate = (value: unknown) =>
  typeof value === 'string' && value.length >= 8 && dayjs(value).isValid()

interface ChartRendererProps {
  chart: ChartDisplay
  rows: ResultRow[]
}

const ChartRenderer = ({ chart, rows }: ChartRendererProps) => {
  const seriesFields = chart.series.map((entry) => entry.field)
  const missingField = !chart.x_axis.field || seriesFields.length === 0

  if (missingField) {
    return (
      <div className="flex h-[240px] w-full items-center justify-center">
        <p className="text-xs text-foreground-light">Choose an x-axis and at least one series</p>
      </div>
    )
  }

  const data = chart.cumulative ? applyCumulative(rows, seriesFields) : rows
  const isDateAxis = looksLikeDate(data[0]?.[chart.x_axis.field])
  const formatX = (value: unknown) =>
    isDateAxis ? dayjs(value as string).format('MMM D') : String(value)

  const axes = (
    <>
      <CartesianGrid vertical={false} stroke={CHART_COLORS.AXIS} />
      <XAxis
        dataKey={chart.x_axis.field}
        tickLine={{ stroke: CHART_COLORS.AXIS }}
        axisLine={{ stroke: CHART_COLORS.AXIS }}
        tickMargin={4}
        minTickGap={24}
        tickFormatter={formatX}
      />
      <YAxis
        tickLine={false}
        axisLine={false}
        tickMargin={4}
        width={48}
        scale={chart.log_scale ? 'log' : 'auto'}
        domain={chart.log_scale ? [1, 'auto'] : undefined}
        allowDataOverflow={chart.log_scale}
      />
      <Tooltip
        content={
          <ChartTooltipContent
            className="min-w-[200px]"
            labelFormatter={(value) => formatX(value)}
          />
        }
      />
      {chart.series.length > 1 && <Legend iconType="circle" iconSize={8} />}
    </>
  )

  return (
    <ChartContainer className="aspect-auto px-3 py-2" style={{ height: 240, minHeight: 240 }}>
      {chart.type === 'line' ? (
        <LineChart data={data} margin={{ left: 0, right: 8, top: 10 }}>
          {axes}
          {chart.series.map((entry, index) => (
            <Line
              key={entry.field}
              type="monotone"
              dataKey={entry.field}
              name={entry.label ?? entry.field}
              stroke={CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length]}
              strokeWidth={2}
              dot={false}
              label={chart.show_labels ? { fontSize: 10, position: 'top' } : undefined}
            />
          ))}
        </LineChart>
      ) : (
        <BarChart data={data} margin={{ left: 0, right: 8, top: 10 }}>
          {axes}
          {chart.series.map((entry, index) => (
            <Bar
              key={entry.field}
              radius={1}
              dataKey={entry.field}
              name={entry.label ?? entry.field}
              fill={CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length]}
              label={chart.show_labels ? { fontSize: 10, position: 'top' } : undefined}
            />
          ))}
        </BarChart>
      )}
    </ChartContainer>
  )
}

interface QueryCellDisplayProps {
  display: QueryDisplay
  rows: ResultRow[]
  className?: string
}

export const QueryCellDisplay = ({ display, rows, className }: QueryCellDisplayProps) => {
  if (rows.length === 0) {
    return (
      <div className="flex h-24 w-full items-center justify-center">
        <p className="text-xs text-foreground-light">No rows returned</p>
      </div>
    )
  }

  if (display.type === 'chart') {
    return (
      <div className={cn('w-full', className)}>
        <ChartRenderer chart={display.chart} rows={rows} />
      </div>
    )
  }

  return (
    <div
      className={cn('flex max-h-72 w-full flex-col overflow-auto overscroll-contain', className)}
    >
      <Results rows={rows} headerClassName="heading-meta text-muted-foreground" />
    </div>
  )
}
