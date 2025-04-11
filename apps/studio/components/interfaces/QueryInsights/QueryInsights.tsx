import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { DateRangePicker } from 'components/ui/DateRangePicker'
import { TabsList_Shadcn_, TabsTrigger_Shadcn_, Tabs_Shadcn_, cn } from 'ui'
import dayjs from 'dayjs'
import { InformationCircleIcon } from '@heroicons/react/16/solid'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { MetricsChart } from './components/MetricsChart'
import { QueryList } from './components/QueryList'
import {
  useQueryInsightsMetrics,
  useQueryInsightsQueries,
  QueryInsightsQuery,
} from 'data/query-insights/query-insights-query'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'

export type MetricType = 'rows_read' | 'query_latency' | 'calls' | 'cache_hits'

const METRICS: { id: MetricType; label: string; description: string }[] = [
  {
    id: 'query_latency',
    label: 'Query Latency',
    description: 'Average query execution time in milliseconds',
  },
  {
    id: 'rows_read',
    label: 'Rows Read',
    description: 'Number of rows read by queries',
  },
  {
    id: 'calls',
    label: 'Calls',
    description: 'Number of query executions over time',
  },
  {
    id: 'cache_hits',
    label: 'Cache Hits',
    description: 'Statistics for shared buffer cache usage',
  },
]

export const QueryInsights = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { project } = useProjectContext()
  const state = useDatabaseSelectorStateSnapshot()
  const { data: databases } = useReadReplicasQuery({ projectRef: ref })

  const [selectedMetric, setSelectedMetric] = useState<MetricType>('query_latency')
  const [selectedTimeRange, setSelectedTimeRange] = useState('1d')
  const [selectedQuery, setSelectedQuery] = useState<QueryInsightsQuery | null>(null)
  const [timeRange, setTimeRange] = useState({
    period_start: {
      date: dayjs().subtract(24, 'hour').format('YYYY-MM-DD HH:mm:ssZ'),
      time_period: '1d',
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

  const { data: queriesData, isLoading: isLoadingQueries } = useQueryInsightsQueries(
    ref,
    timeRange.period_start.date,
    timeRange.period_end.date
  )

  const selectedDatabase = databases?.find((db) => db.identifier === state.selectedDatabaseId)

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
    <div className="flex flex-col gap-6 flex-grow">
      <div className="flex items-center justify-between px-5 pt-5">
        <div>
          <h3 className="text-xl text-foreground">Query Metrics</h3>
          <p className="text-sm text-foreground-light">
            Monitor and analyze query performance over time
          </p>
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
        onValueChange={(value) => setSelectedMetric(value as MetricType)}
        className="space-y-4"
      >
        <TabsList_Shadcn_ className="px-5 flex gap-5">
          {METRICS.map((metric) => (
            <TabsTrigger_Shadcn_ key={metric.id} value={metric.id}>
              {metric.label}
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
          />
        </div>
      </Tabs_Shadcn_>

      <div className="px-5">
        <h3 className="text-xl text-foreground">Recent Queries</h3>
        <p className="text-sm text-foreground-light">Detailed view of recent query executions</p>
      </div>

      <QueryList
        queries={queriesData || []}
        isLoading={isLoadingQueries}
        onQuerySelect={setSelectedQuery}
        selectedQuery={selectedQuery}
      />
    </div>
  )
}
