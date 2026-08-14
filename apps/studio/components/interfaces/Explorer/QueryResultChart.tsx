import { useMemo } from 'react'
import { Chart, ChartBar, ChartCard, ChartContent, ChartLine } from 'ui-patterns/Chart'

import { type QueryChartConfig, type QueryResult } from './types'
import NoDataPlaceholder from '@/components/ui/Charts/NoDataPlaceholder'
import { formatLogTick, getCumulativeResults } from '@/components/ui/QueryBlock/QueryBlock.utils'

interface QueryResultChartProps {
  chart?: QueryChartConfig
  result?: QueryResult
}

// [Joshen] Will need to implement log scale - refer to QueryBlock.tsx `effectiveLogScale`
// [Joshen] Will also need to implement error handling where appropriate (e.g if query errors)

const toChartValue = (value: unknown): string | number => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  return String(value)
}

export const QueryResultChart = ({ chart, result }: QueryResultChartProps) => {
  const { type, x_column, y_columns = [], cumulative, show_labels, scale } = chart ?? {}

  const hasConfig = !!x_column && y_columns.length > 0
  const chartRows = useMemo(() => {
    const xKey = x_column ?? ''
    const yKey = y_columns[0] ?? ''
    return (result?.rows ?? []).map((row) => ({
      [xKey]: toChartValue(row[xKey]),
      [yKey]: toChartValue(row[yKey]),
    }))
  }, [result, x_column, y_columns])

  const cumulativeResults = useMemo(
    () => getCumulativeResults({ rows: chartRows }, { yKey: y_columns[0] ?? '' }),
    [chartRows, y_columns]
  )
  const resultToRender = cumulative ? cumulativeResults : chartRows

  if (!result || (result?.rows && result.rows.length === 0)) {
    return (
      <NoDataPlaceholder
        className="bg border-0"
        size="normal"
        message="No results"
        description="Your query returned no rows"
      />
    )
  }

  if (!hasConfig) {
    return (
      <NoDataPlaceholder
        className="bg border-0"
        size="normal"
        message="Configure your chart"
        description="Select your X and Y axis in the display settings"
      />
    )
  }

  return (
    <Chart>
      <ChartCard className="rounded-none border-0">
        <ChartContent>
          <div className="h-40">
            {type === 'bar' && (
              <ChartBar
                isFullHeight
                xKey={x_column}
                dataKey={y_columns[0]}
                showXAxis={show_labels}
                showYAxis={show_labels}
                data={resultToRender}
                YAxisProps={{
                  scale: scale === 'log' ? 'log' : 'auto',
                  domain: scale === 'log' ? [1, 'auto'] : undefined,
                  tickFormatter: scale === 'log' ? formatLogTick : undefined,
                }}
              />
            )}
            {type === 'line' && (
              <ChartLine
                isFullHeight
                xKey={x_column}
                dataKey={y_columns[0]}
                showXAxis={show_labels}
                showYAxis={show_labels}
                data={resultToRender}
                YAxisProps={{
                  scale: scale === 'log' ? 'log' : 'auto',
                  domain: scale === 'log' ? [1, 'auto'] : undefined,
                  tickFormatter: scale === 'log' ? formatLogTick : undefined,
                }}
              />
            )}
          </div>
        </ChartContent>
      </ChartCard>
    </Chart>
  )
}
