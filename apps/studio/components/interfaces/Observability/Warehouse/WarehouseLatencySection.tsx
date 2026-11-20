import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { WarehouseMetricChart } from './WarehouseMetricChart'
import type { WarehouseMetricsRange } from './WarehouseMetrics.range'
import { AlertError } from '@/components/ui/AlertError'
import type { WarehouseMetricName } from '@/data/warehouse/warehouse-metrics-api-types'
import { warehouseMetricsQueryOptions } from '@/data/warehouse/warehouse-metrics-query'

const LATENCY_METRICS: WarehouseMetricName[] = [
  'query_duration_mean',
  'query_duration_p50',
  'query_duration_p95',
  'query_duration_p99',
  'assignment_wait_mean',
  'assignment_wait_p95',
  'duckdb_duration_mean',
]

const MILLISECOND_CHART_PROPS = { unit: 'ms', scale: 1000 } as const

export const WarehouseLatencySection = ({
  range,
}: {
  range: Extract<WarehouseMetricsRange, { status: 'ok' }>
}) => {
  const { ref } = useParams()
  const query = useQuery(
    warehouseMetricsQueryOptions({
      projectRef: ref,
      attributes: LATENCY_METRICS,
      startDate: range.startDate,
      endDate: range.endDate,
      interval: range.interval,
    })
  )

  const getMetric = (name: WarehouseMetricName) =>
    query.data?.metrics.find((item) => item.metric === name)

  return (
    <div className="relative space-y-4">
      <p role="status" className="sr-only">
        {getLatencyStatus(query.status)}
      </p>
      <h2 className="text-base">Latency</h2>
      {query.isPending && <GenericSkeletonLoader />}
      {query.isError && (
        <AlertError
          projectRef={ref}
          error={query.error}
          subject="Failed to retrieve latency metrics"
          additionalActions={<Button onClick={() => query.refetch()}>Retry</Button>}
        />
      )}
      {query.data && (
        <>
          <WarehouseMetricChart
            title="Query duration"
            description="Time until a query succeeds, fails, or is canceled, including worker waits and result streaming."
            metric={getMetric('query_duration_p95')}
            series={[
              { metric: getMetric('query_duration_mean'), label: 'Average' },
              { metric: getMetric('query_duration_p50'), label: 'p50' },
              { metric: getMetric('query_duration_p95'), label: 'p95' },
              { metric: getMetric('query_duration_p99'), label: 'p99' },
            ]}
            {...MILLISECOND_CHART_PROPS}
          />
          <div className="grid gap-4 md:grid-cols-2">
            <WarehouseMetricChart
              title="Time waiting for a worker"
              description="Time spent acquiring a worker, excluding SQL setup such as DuckLake connections, measured per attempt including retries rather than per query."
              metric={getMetric('assignment_wait_p95')}
              series={[
                { metric: getMetric('assignment_wait_mean'), label: 'Average' },
                { metric: getMetric('assignment_wait_p95'), label: 'p95' },
              ]}
              {...MILLISECOND_CHART_PROPS}
            />
            <WarehouseMetricChart
              title="Successful query duration"
              description="Average successful query duration on a worker, including result streaming and client backpressure."
              metric={getMetric('duckdb_duration_mean')}
              {...MILLISECOND_CHART_PROPS}
            />
          </div>
        </>
      )}
    </div>
  )
}

const getLatencyStatus = (status: 'pending' | 'error' | 'success') => {
  switch (status) {
    case 'pending':
      return 'Loading latency metrics'
    case 'error':
      return 'Could not load latency metrics'
    case 'success':
      return 'Latency metrics loaded'
  }
}
