import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'common'
import { parseAsString, useQueryStates } from 'nuqs'
import { DateRangePicker } from 'components/ui/DateRangePicker'
import {
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { InformationCircleIcon } from '@heroicons/react/16/solid'
import dayjs from 'dayjs'
import { MetricsChart } from './MetricsChart/MetricsChart'
import { QueryList } from './QueryList/QueryList'
import {
  useQueryInsightsMetrics,
  useQueryInsightsQueries,
  useQueryInsightsQueriesWithErrors,
  usePreFetchQueryInsightsData,
  QueryInsightsQuery,
} from 'data/query-insights/query-insights-query'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'

export type MetricType = 'rows_read' | 'query_latency' | 'calls' | 'cache_hits' | 'issues'

export const QueryInsights = () => {
  console.log('🚀 [QueryInsights] Component rendered - START')
  // Queries with error_count > 0 (slow queries with mean_exec_time > 1000ms and calls > 1)
  // are highlighted in red in the QueryList component
  const { ref } = useParams()
  const state = useDatabaseSelectorStateSnapshot()
  const { data: databases } = useReadReplicasQuery({ projectRef: ref })

  // Use URL state for metric persistence, similar to QueryPerformance
  const [{ metric }, setSearchParams] = useQueryStates({
    metric: parseAsString.withDefault('query_latency' as MetricType),
  })

  // Validate that the metric is a valid MetricType, fallback to default if not
  const selectedMetric: MetricType = (
    ['rows_read', 'query_latency', 'calls', 'cache_hits', 'issues'].includes(metric || '')
      ? metric
      : 'query_latency'
  ) as MetricType
  const [selectedTimeRange, setSelectedTimeRange] = useState('3h')
  const [selectedQuery, setSelectedQuery] = useState<QueryInsightsQuery | null>(null)
  const [hoveredQuery, setHoveredQuery] = useState<QueryInsightsQuery | null>(null)
  const [timeRange, setTimeRange] = useState({
    period_start: {
      date: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ssZ'),
      time_period: '3h',
    },
    period_end: {
      date: dayjs().format('YYYY-MM-DD HH:mm:ssZ'),
      time_period: 'now',
    },
  })

  const { data: metricsData, isLoading: isLoadingMetrics } = useQueryInsightsMetrics(
    ref,
    selectedMetric,
    timeRange.period_start.date,
    timeRange.period_end.date
  )

  // Always fetch query latency data for p95 calculation
  const { data: latencyData } = useQueryInsightsMetrics(
    ref,
    'query_latency',
    timeRange.period_start.date,
    timeRange.period_end.date
  )

  // Always fetch rows read data for total calculation
  const { data: rowsReadData } = useQueryInsightsMetrics(
    ref,
    'rows_read',
    timeRange.period_start.date,
    timeRange.period_end.date
  )

  // Always fetch issues data for issues calculation
  const { data: issuesData } = useQueryInsightsMetrics(
    ref,
    'issues',
    timeRange.period_start.date,
    timeRange.period_end.date
  )

  const { data: queriesData, isLoading: isLoadingQueries } = useQueryInsightsQueries(
    ref,
    timeRange.period_start.date,
    timeRange.period_end.date
  )

  // Fetch queries with errors for the errors tab
  const { data: queriesWithErrorsData, isLoading: isLoadingQueriesWithErrors } =
    useQueryInsightsQueriesWithErrors(ref, timeRange.period_start.date, timeRange.period_end.date)

  // Pre-fetch all metrics data for the current time range
  usePreFetchQueryInsightsData(ref, timeRange.period_start.date, timeRange.period_end.date)

  // Calculate p95 latency for the query latency tab
  const p95Latency = useMemo(() => {
    if (latencyData && latencyData.length > 0) {
      // Calculate average p95 across all data points in the current timeframe
      const validP95Values = latencyData
        .map((point) => point.p95)
        .filter((p95Value): p95Value is number => p95Value !== undefined && !isNaN(p95Value))

      if (validP95Values.length > 0) {
        const averageP95 =
          validP95Values.reduce((sum, value) => sum + value, 0) / validP95Values.length
        return `${averageP95.toFixed(2)}ms`
      }
    }
    return null
  }, [latencyData])

  // Calculate rows read for the rows read tab (simplified for now)
  const rowsRead = useMemo(() => {
    if (rowsReadData && rowsReadData.length > 0) {
      return 'Data available'
    }
    return null
  }, [rowsReadData])

  // Calculate error count for the errors tab
  const errorCount = useMemo(() => {
    if (issuesData && issuesData.length > 0) {
      const totalIssues = issuesData.reduce((sum, point) => sum + (point.value || 0), 0)
      return `${totalIssues} slow queries`
    }
    return '0 slow queries'
  }, [issuesData])

  // Debug logging
  console.log('🔍 [QueryInsights] Debug info:', {
    selectedMetric,
    metricsDataLength: metricsData?.length || 0,
    queriesDataLength: queriesData?.length || 0,
    queriesWithErrorsDataLength: queriesWithErrorsData?.length || 0,
    issuesDataLength: issuesData?.length || 0,
    issuesDataSample: issuesData?.slice(0, 3) || [],
    isLoadingQueries,
    isLoadingQueriesWithErrors,
    errorCount: errorCount,
  })

  // Define metrics with dynamic descriptions
  const METRICS: { id: MetricType; label: string; description: string; tooltip: string }[] = [
    {
      id: 'query_latency',
      label: 'Query latency',
      description: `p95: ${p95Latency}`,
      tooltip: 'Shows the latency of each query execution.',
    },
    {
      id: 'rows_read',
      label: 'Rows read',
      description: '0 rows',
      tooltip: 'Displays the total number of rows read by queries over time',
    },

    {
      id: 'calls',
      label: 'Calls',
      description: '0 calls',
      tooltip: 'Shows the frequency of query executions and their distribution over time',
    },
    {
      id: 'cache_hits',
      label: 'Cache hits',
      description: '0%',
      tooltip: 'Displays cache hit rates and shared buffer cache performance statistics',
    },
    {
      id: 'issues',
      label: 'Issues',
      description: errorCount,
      tooltip: 'Shows queries with potential performance issues (slow queries)',
    },
  ]

  // Event listener for clearing the selected query
  useEffect(() => {
    const handleClearSelectedQuery = (event: CustomEvent) => {
      if (event.detail?.clearQuery) {
        setSelectedQuery(null)
      }
    }

    window.addEventListener(
      'clearSelectedQueryInsightsQuery',
      handleClearSelectedQuery as EventListener
    )

    return () => {
      window.removeEventListener(
        'clearSelectedQueryInsightsQuery',
        handleClearSelectedQuery as EventListener
      )
    }
  }, [])

  useEffect(() => {
    // Update the time range when selectedTimeRange changes
    switch (selectedTimeRange) {
      case '3h':
        setTimeRange({
          period_start: {
            date: dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ssZ'),
            time_period: '3h',
          },
          period_end: {
            date: dayjs().format('YYYY-MM-DD HH:mm:ssZ'),
            time_period: 'now',
          },
        })
        break
      case '1d':
        setTimeRange({
          period_start: {
            date: dayjs().subtract(24, 'hour').format('YYYY-MM-DD HH:mm:ssZ'),
            time_period: '1d',
          },
          period_end: {
            date: dayjs().format('YYYY-MM-DD HH:mm:ssZ'),
            time_period: 'now',
          },
        })
        break
      case '7d':
        setTimeRange({
          period_start: {
            date: dayjs().subtract(7, 'day').format('YYYY-MM-DD HH:mm:ssZ'),
            time_period: '7d',
          },
          period_end: {
            date: dayjs().format('YYYY-MM-DD HH:mm:ssZ'),
            time_period: 'now',
          },
        })
        break
      case '30d':
        setTimeRange({
          period_start: {
            date: dayjs().subtract(30, 'day').format('YYYY-MM-DD HH:mm:ssZ'),
            time_period: '30d',
          },
          period_end: {
            date: dayjs().format('YYYY-MM-DD HH:mm:ssZ'),
            time_period: 'now',
          },
        })
        break
    }
  }, [selectedTimeRange])

  return (
    <div className="flex flex-col flex-grow">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h3 className="text-xl text-foreground">Query Insights</h3>
        </div>
        <DateRangePicker
          value={selectedTimeRange}
          loading={isLoadingMetrics}
          onChange={({ period_start, period_end, interval }) => {
            // If selecting the same time range again, force a refresh by setting with a new object
            if (period_start.time_period === selectedTimeRange) {
              const newTimeRange = {
                period_start: {
                  date:
                    period_start.time_period === '1d'
                      ? dayjs().subtract(24, 'hour').format('YYYY-MM-DD HH:mm:ssZ')
                      : period_start.time_period === '3h'
                        ? dayjs().subtract(3, 'hour').format('YYYY-MM-DD HH:mm:ssZ')
                        : period_start.time_period === '7d'
                          ? dayjs().subtract(7, 'day').format('YYYY-MM-DD HH:mm:ssZ')
                          : period_start.time_period === '30d'
                            ? dayjs().subtract(30, 'day').format('YYYY-MM-DD HH:mm:ssZ')
                            : period_start.date,
                  time_period: period_start.time_period,
                },
                period_end: {
                  date: dayjs().format('YYYY-MM-DD HH:mm:ssZ'),
                  time_period: 'now',
                },
              }

              // Reset state to force a refresh
              setTimeRange(newTimeRange)

              // Temporarily set to a different value and then back
              setSelectedTimeRange('__refreshing__')
              setTimeout(() => setSelectedTimeRange(period_start.time_period), 10)
            } else {
              // Normal update for changing to a different time period
              setSelectedTimeRange(period_start.time_period)
              setTimeRange({ period_start, period_end })
            }
          }}
          options={[
            {
              key: '3h',
              label: 'Last 3 hours',
              interval: '30m',
            },
            {
              key: '1d',
              label: 'Last 24 hours',
              interval: '1h',
            },
            {
              key: '7d',
              label: 'Last 7 days',
              interval: '1d',
            },
            {
              key: '30d',
              label: 'Last 30 days',
              interval: '1d',
            },
          ]}
        />
      </div>

      <Tabs_Shadcn_
        value={selectedMetric}
        defaultValue={selectedMetric}
        onValueChange={(value) => setSearchParams({ metric: value as MetricType })}
        // className="pb-4"
      >
        <TabsList_Shadcn_ className={cn('flex gap-0 border-0 items-end z-10')}>
          {METRICS.map((metric) => (
            <TabsTrigger_Shadcn_
              key={metric.id}
              value={metric.id}
              className={cn(
                'group relative',
                'px-6 py-3 border-b-0 flex flex-col items-start !shadow-none border-default border-t',
                'even:border-x last:border-r even:!border-x-strong last:!border-r-strong',
                metric.id === selectedMetric ? '!bg-surface-200' : '!bg-surface-200/[33%]',
                'hover:!bg-surface-100',
                'data-[state=active]:!bg-surface-200',
                'hover:text-foreground-light',
                'transition'
              )}
            >
              {metric.id === selectedMetric && (
                <div className="absolute top-0 left-0 w-full h-[1px] bg-foreground" />
              )}

              <div className="flex items-center gap-x-2">
                <span className="">{metric.label}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <InformationCircleIcon className="transition text-foreground-muted w-3 h-3 data-[state=delayed-open]:text-foreground-light" />
                  </TooltipTrigger>
                  <TooltipContent side="top">{metric.tooltip}</TooltipContent>
                </Tooltip>
              </div>

              <span className="text-xs text-foreground-muted group-hover:text-foreground-lighter group-data-[state=active]:text-foreground-lighter transition">
                {metric.description}
              </span>
            </TabsTrigger_Shadcn_>
          ))}
        </TabsList_Shadcn_>

        <div className="h-80">
          <MetricsChart
            data={metricsData ?? []}
            metric={selectedMetric}
            isLoading={isLoadingMetrics}
            startTime={timeRange.period_start.date}
            endTime={timeRange.period_end.date}
            selectedQuery={selectedQuery}
            hoveredQuery={hoveredQuery}
          />
        </div>
      </Tabs_Shadcn_>

      <QueryList
        queries={selectedMetric === 'issues' ? queriesWithErrorsData || [] : queriesData || []}
        isLoading={selectedMetric === 'issues' ? isLoadingQueriesWithErrors : isLoadingQueries}
        onQuerySelect={setSelectedQuery}
        onQueryHover={setHoveredQuery}
        selectedQuery={selectedQuery}
        hoveredQuery={hoveredQuery}
      />
    </div>
  )
}
