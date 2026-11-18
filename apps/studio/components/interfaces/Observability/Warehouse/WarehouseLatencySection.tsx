import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { WarehouseMetricChart } from './WarehouseMetricChart'
import type { WarehouseMetricsRange } from './WarehouseMetrics.range'
import { AlertError } from '@/components/ui/AlertError'
import { warehouseMetricsQueryOptions } from '@/data/warehouse/warehouse-metrics-query'

export const WarehouseLatencySection = ({
  range,
}: {
  range: Extract<WarehouseMetricsRange, { status: 'ok' }>
}) => {
  const { ref } = useParams()
  const query = useQuery(
    warehouseMetricsQueryOptions({
      projectRef: ref,
      attributes: [
        'query_duration_mean',
        'query_duration_p50',
        'query_duration_p95',
        'query_duration_p99',
        'assignment_wait_mean',
        'assignment_wait_p95',
        'duckdb_duration_mean',
      ],
      startDate: range.startDate,
      endDate: range.endDate,
      interval: range.interval,
    })
  )
  const renderContent = () => {
    switch (query.status) {
      case 'pending':
        return <GenericSkeletonLoader aria-label="Loading latency metrics" />
      case 'error':
        return (
          <AlertError
            projectRef={ref}
            error={query.error}
            subject="Failed to retrieve latency metrics"
            additionalActions={<Button onClick={() => query.refetch()}>Retry</Button>}
          />
        )
      case 'success': {
        const metric = (name: string) => query.data.metrics.find((item) => item.metric === name)
        return (
          <div className="space-y-4">
            <h2 className="text-base">Latency</h2>
            <WarehouseMetricChart
              title="Query duration"
              description="Time until a query succeeds, fails, or is canceled, including worker waits and result streaming."
              metric={metric('query_duration_p95')}
              series={[
                { metric: metric('query_duration_mean'), label: 'Average' },
                { metric: metric('query_duration_p50'), label: 'p50' },
                { metric: metric('query_duration_p95'), label: 'p95' },
                { metric: metric('query_duration_p99'), label: 'p99' },
              ]}
              unit=" ms"
              scale={1000}
            />
            <div className="grid gap-4 md:grid-cols-2">
              <WarehouseMetricChart
                title="Time waiting for a worker"
                description="Time spent acquiring a worker, excluding SQL setup such as DuckLake connections, measured per attempt including retries rather than per query."
                metric={metric('assignment_wait_p95')}
                series={[
                  { metric: metric('assignment_wait_mean'), label: 'Average' },
                  { metric: metric('assignment_wait_p95'), label: 'p95' },
                ]}
                unit=" ms"
                scale={1000}
              />
              <WarehouseMetricChart
                title="Successful query duration"
                description="Average successful query duration on a worker, including result streaming and client backpressure."
                metric={metric('duckdb_duration_mean')}
                unit=" ms"
                scale={1000}
              />
            </div>
          </div>
        )
      }
    }
  }

  return (
    <div className="relative">
      <p role="status" className="sr-only">
        {getLatencyStatus(query.status)}
      </p>
      {renderContent()}
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
