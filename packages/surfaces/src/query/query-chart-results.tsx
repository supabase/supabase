import { QUERY_RESULT_ROW_LIMIT, type ChartConfig, type QuerySource } from '../contract'
import { chartRowsForSource, prepareChart } from './query-display'
import type { QueryResult } from './query-model'
import { QueryResultChart } from './QueryResultChart'

function ChartBody({
  title,
  chart,
  result,
  source,
}: {
  title?: string
  chart?: ChartConfig
  result: QueryResult
  source: QuerySource
}) {
  const isConfigured = !!chart?.x_column && chart.y_series.length > 0
  // Unconfigured charts and empty results get the chart's own empty states.
  if (!chart || !isConfigured || result.rows.length === 0) {
    return <QueryResultChart title={title} chart={chart} result={result} />
  }

  const prepared = prepareChart(result.rows, chart)
  if (prepared.missing.length > 0) {
    return (
      <p className="p-3 text-xs text-foreground-lighter">
        These columns are no longer in the results: {prepared.missing.join(', ')}. Choose columns in
        result settings.
      </p>
    )
  }
  if (!prepared.hasValues) {
    return (
      <p className="p-3 text-xs text-foreground-lighter">
        Choose numeric columns for the Y axis in result settings.
      </p>
    )
  }

  // A log scale the data cannot support falls back to linear rather than drawing nothing.
  return (
    <QueryResultChart
      title={title}
      chart={{ ...chart, scale: prepared.scale }}
      result={{ rows: chartRowsForSource(result.rows, chart, source) }}
    />
  )
}

export function QueryChartResults({
  title,
  chart,
  result,
  source,
  isBusy,
  className,
}: {
  title?: string
  chart?: ChartConfig
  result: QueryResult
  source: QuerySource
  isBusy: boolean
  className?: string
}) {
  return (
    <div aria-busy={isBusy} className={className}>
      <div className="flex min-h-0 flex-1">
        <ChartBody title={title} chart={chart} result={result} source={source} />
      </div>
      {result.paginated && (
        <p className="px-3 py-2 text-xs text-foreground-lighter">
          Chart shows the current page of results.
        </p>
      )}
      {result.truncated && (
        <p className="px-3 py-2 text-xs text-foreground-lighter">
          Chart shows the first {QUERY_RESULT_ROW_LIMIT.toLocaleString()} returned rows. Add a LIMIT
          to bound larger queries.
        </p>
      )}
    </div>
  )
}
