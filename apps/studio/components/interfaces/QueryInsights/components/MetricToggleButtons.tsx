import { motion, AnimatePresence } from 'framer-motion'
import { cn } from 'ui'
import { ChartConfigType, ChartConfigResult } from '../chartConfigs'
import { QueryInsightsQuery } from 'data/query-insights/query-insights-query'
import { MetricType } from '../QueryInsights'
import { MetricPill } from './MetricPill'

// Define the exact shape of the visibleMetrics state
export interface VisibleMetricsState {
  // Old keys for backward compatibility
  p50?: boolean
  p95?: boolean
  p99?: boolean
  p99_9?: boolean

  // New latency keys
  latency_p50?: boolean
  latency_p90?: boolean
  latency_p99?: boolean

  // Common keys
  query_latency: boolean
  rows: boolean
  query_rows: boolean
  shared_blks_hit: boolean
  shared_blks_read: boolean
  shared_blks_dirtied: boolean
  shared_blks_written: boolean
  cache_hit_ratio: boolean
  cache_miss_ratio: boolean
  calls: boolean
  query_calls: boolean
  [key: string]: boolean | undefined // Allow string indexing with optional values
}

interface MetricToggleButtonsProps {
  chartConfig: ChartConfigResult<any>
  visibleMetrics: VisibleMetricsState
  setVisibleMetrics: (value: React.SetStateAction<VisibleMetricsState>) => void
  metric: MetricType
  selectedQuery: QueryInsightsQuery | null
}

export const MetricToggleButtons = ({
  chartConfig,
  visibleMetrics,
  setVisibleMetrics,
  metric,
  selectedQuery,
}: MetricToggleButtonsProps) => {
  if (!chartConfig) return null

  const { config, chartData } = chartConfig

  return (
    <AnimatePresence>
      {Object.entries(config).map(([key, value]) => {
        // If we have a selected query, hide the query-specific metrics since they'll
        // be shown inside the Selected Query pill
        if (
          (key === 'query_rows' || key === 'query_latency' || key === 'query_calls') &&
          selectedQuery
        ) {
          return null
        }

        // Only show query-specific metrics when a query is selected
        if (
          (key === 'query_rows' || key === 'query_latency' || key === 'query_calls') &&
          !selectedQuery
        ) {
          return null
        }

        // Filter out the blocks metrics for cache hits chart
        if (
          metric === 'cache_hits' &&
          (key === 'shared_blks_dirtied' || key === 'shared_blks_written')
        ) {
          return null
        }

        // Calculate metric value based on the type of metric
        let metricValue: number

        // For rows and calls metrics, calculate the total across all data points
        if (key === 'rows' || key === 'calls') {
          metricValue = chartData.reduce((sum, point) => {
            const value = Number(point[key as keyof typeof point])
            return sum + (isNaN(value) ? 0 : value)
          }, 0)
        }
        // For latency metrics, calculate the average of all data points
        else if (
          key.includes('latency') ||
          key.includes('p50') ||
          key.includes('p95') ||
          key.includes('p99')
        ) {
          const points = chartData.filter((point) => {
            const value = Number(point[key as keyof typeof point])
            return !isNaN(value) && value > 0
          })

          metricValue =
            points.length > 0
              ? points.reduce((sum, point) => {
                  const value = Number(point[key as keyof typeof point])
                  return sum + value
                }, 0) / points.length
              : 0
        }
        // For ratio metrics, use the last data point
        else if (
          key.includes('ratio') ||
          key.includes('percentage') ||
          key.includes('cache_hit_ratio') ||
          key.includes('cache_miss_ratio')
        ) {
          metricValue = Number(
            chartData[chartData.length - 1]?.[key as keyof (typeof chartData)[0]]
          )
        }
        // For all other metrics, use the last data point as default
        else {
          metricValue = Number(
            chartData[chartData.length - 1]?.[key as keyof (typeof chartData)[0]]
          )
        }

        const formattedValue = !isNaN(metricValue) ? (value as any).formatter(metricValue) : '0'

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.95, x: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -8 }}
            transition={{ duration: 0.15 }}
          >
            <MetricPill
              label={(value as any).label}
              value={formattedValue}
              color={(value as any).color}
              metricType={metric}
              isActive={visibleMetrics[key]}
              onClick={() =>
                setVisibleMetrics((prev) => ({
                  ...prev,
                  [key]: !prev[key],
                }))
              }
            />
          </motion.div>
        )
      })}
    </AnimatePresence>
  )
}
