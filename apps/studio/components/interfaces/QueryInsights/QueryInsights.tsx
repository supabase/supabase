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
} from 'data/query-insights/query-insights-query'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'

export type MetricType = 'rows_read' | 'rows_written' | 'query_latency' | 'queries_per_second'

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
    id: 'rows_written',
    label: 'Rows Written',
    description: 'Number of rows written by queries',
  },
  {
    id: 'queries_per_second',
    label: 'Queries per Second',
    description: 'Number of queries executed per second',
  },
]

export const QueryInsights = () => {
  const router = useRouter()
  const { ref } = useParams()
  const { project } = useProjectContext()
  const state = useDatabaseSelectorStateSnapshot()
  const { data: databases } = useReadReplicasQuery({ projectRef: ref })

  const [selectedMetric, setSelectedMetric] = useState<MetricType>('query_latency')
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')
  const [timeRange, setTimeRange] = useState({
    period_start: {
      date: dayjs().subtract(24, 'hour').format('YYYY-MM-DD HH:mm:ssZ'),
      time_period: '24h',
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
      case '24h':
        setTimeRange({
          period_start: {
            date: dayjs().subtract(24, 'hour').format('YYYY-MM-DD HH:mm:ssZ'),
            time_period: '24h',
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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
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
            setSelectedTimeRange(period_start.time_period)
            setTimeRange({ period_start, period_end })
          }}
          options={[
            {
              key: '24h',
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
        <TabsList_Shadcn_>
          {METRICS.map((metric) => (
            <TabsTrigger_Shadcn_ key={metric.id} value={metric.id}>
              {metric.label}
            </TabsTrigger_Shadcn_>
          ))}
        </TabsList_Shadcn_>

        <div className="h-80">
          <MetricsChart data={metricsData} metric={selectedMetric} isLoading={isLoadingMetrics} />
        </div>
      </Tabs_Shadcn_>

      <div>
        <h3 className="text-xl text-foreground">Recent Queries</h3>
        <p className="text-sm text-foreground-light">Detailed view of recent query executions</p>
      </div>

      <QueryList queries={queriesData || []} isLoading={isLoadingQueries} />
    </div>
  )
}
