import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { WarehouseMetricChart } from './WarehouseMetricChart'
import type { WarehouseMetricsRange } from './WarehouseMetrics.range'
import { AlertError } from '@/components/ui/AlertError'
import type { WarehouseMetricName } from '@/data/warehouse/warehouse-metrics-api-types'
import { warehouseMetricsQueryOptions } from '@/data/warehouse/warehouse-metrics-query'

const WORKER_METRICS: WarehouseMetricName[] = [
  'activation_rate',
  'activation_duration_mean',
  'activation_duration_p95',
  'rpc_rate',
  'rpc_duration_mean',
  'rpc_duration_p95',
]

const MILLISECOND_CHART_PROPS = { unit: 'ms', scale: 1000 } as const

const getWorkerStatus = (status: 'pending' | 'error' | 'success') => {
  switch (status) {
    case 'pending':
      return 'Loading worker metrics'
    case 'error':
      return 'Could not load worker metrics'
    case 'success':
      return 'Worker metrics loaded'
  }
}

export const WarehouseWorkersSection = ({
  range,
}: {
  range: Extract<WarehouseMetricsRange, { status: 'ok' }>
}) => {
  const { ref } = useParams()

  const query = useQuery(
    warehouseMetricsQueryOptions({
      projectRef: ref,
      attributes: WORKER_METRICS,
      startDate: range.startDate,
      endDate: range.endDate,
      interval: range.interval,
    })
  )

  const getMetric = (name: WarehouseMetricName) =>
    query.data?.metrics.find((item) => item.metric === name)

  return (
    <div className="relative">
      <p role="status" className="sr-only">
        {getWorkerStatus(query.status)}
      </p>
      {query.isPending && <GenericSkeletonLoader aria-label="Loading worker metrics" />}
      {query.isError && (
        <AlertError
          projectRef={ref}
          error={query.error}
          subject="Failed to retrieve worker metrics"
          additionalActions={<Button onClick={() => query.refetch()}>Retry</Button>}
        />
      )}
      {query.data && (
        <div className="space-y-4">
          <h2 className="text-base">Worker activity</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <WarehouseMetricChart
              title="Worker starts"
              description="Workers started per second, split by kind and result."
              metric={getMetric('activation_rate')}
              unit="/s"
            />
            <WarehouseMetricChart
              title="Worker start time"
              description="How long it takes a worker to start, split by kind and result."
              metric={getMetric('activation_duration_p95')}
              series={[
                { metric: getMetric('activation_duration_mean'), label: 'Average' },
                { metric: getMetric('activation_duration_p95'), label: 'p95' },
              ]}
              {...MILLISECOND_CHART_PROPS}
            />
          </div>
          <WarehouseMetricChart
            title="Requests by method"
            description="Requests per second, split by method and status. Not a count of SQL statements."
            metric={getMetric('rpc_rate')}
            unit="/s"
          />
          <WarehouseMetricChart
            title="Request duration"
            description="How long requests take to complete, split by method and status."
            metric={getMetric('rpc_duration_p95')}
            series={[
              { metric: getMetric('rpc_duration_mean'), label: 'Average' },
              { metric: getMetric('rpc_duration_p95'), label: 'p95' },
            ]}
            {...MILLISECOND_CHART_PROPS}
          />
        </div>
      )}
    </div>
  )
}
