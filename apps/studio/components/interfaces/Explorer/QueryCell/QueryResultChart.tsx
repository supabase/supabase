import { useMemo } from 'react'
import { Chart, ChartBar, ChartCard, ChartContent, ChartLine } from 'ui-patterns/Chart'

import { type QueryResult } from '../types'
import NoDataPlaceholder from '@/components/ui/Charts/NoDataPlaceholder'
import { getCumulativeResults } from '@/components/ui/QueryBlock/QueryBlock.utils'
import { type DatabaseCell as DatabaseCellSchema } from '@/data/content/notebooks/notebook-schema'

interface QueryResultChartProps {
  cell: DatabaseCellSchema
  result?: QueryResult
}

// [Joshen] Will need to implement log scale - refer to QueryBlock.tsx `effectiveLogScale`
// [Joshen] Will also need to implement error handling where appropriate (e.g if query errors)

const toChartValue = (value: unknown): string | number => {
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value === null || value === undefined) return ''
  return String(value)
}

export const QueryResultChart = ({ cell, result }: QueryResultChartProps) => {
  const { chart } = cell
  const { type, x_column, y_column, cumulative, show_labels } = chart ?? {}

  const hasConfig = !!x_column && !!y_column
  const chartRows = useMemo(() => {
    const xKey = x_column ?? ''
    const yKey = y_column ?? ''
    return (result?.rows ?? []).map((row) => ({
      [xKey]: toChartValue(row[xKey]),
      [yKey]: toChartValue(row[yKey]),
    }))
  }, [result, x_column, y_column])
  const cumulativeResults = useMemo(
    () => getCumulativeResults({ rows: chartRows }, { yKey: y_column ?? '' }),
    [chartRows, y_column]
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
                dataKey={y_column}
                showXAxis={show_labels}
                showYAxis={show_labels}
                data={resultToRender}
              />
            )}
            {type === 'line' && (
              <ChartLine
                isFullHeight
                xKey={x_column}
                dataKey={y_column}
                showXAxis={show_labels}
                showYAxis={show_labels}
                data={resultToRender}
              />
            )}
          </div>
        </ChartContent>
      </ChartCard>
    </Chart>
  )
}
