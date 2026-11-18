import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { WarehouseMetricChart } from './WarehouseMetricChart'
import type { WarehouseMetricsRange } from './WarehouseMetrics.range'
import { AlertError } from '@/components/ui/AlertError'
import type { WarehouseMetricName } from '@/data/warehouse/warehouse-metrics-api-types'
import { warehouseMetricsQueryOptions } from '@/data/warehouse/warehouse-metrics-query'

const getWorkerStatus = (view: 'pending' | 'error' | 'success') => {
  switch (view) {
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
      attributes: [
        'activation_rate',
        'activation_duration_mean',
        'activation_duration_p95',
        'rpc_rate',
        'rpc_duration_mean',
        'rpc_duration_p95',
      ],
      startDate: range.startDate,
      endDate: range.endDate,
      interval: range.interval,
    })
  )

  const renderContent = () => {
    switch (query.status) {
      case 'pending':
        return <GenericSkeletonLoader aria-label="Loading worker metrics" />
      case 'error':
        return (
          <AlertError
            projectRef={ref}
            error={query.error}
            subject="Failed to retrieve worker metrics"
            additionalActions={<Button onClick={() => query.refetch()}>Retry</Button>}
          />
        )
      case 'success': {
        const metric = (name: WarehouseMetricName) =>
          query.data.metrics.find((item) => item.metric === name)
        return (
          <div className="space-y-4">
            <h2 className="text-base">Worker activity</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <WarehouseMetricChart
                title="Worker starts"
                description="Workers started per second, split by kind and result."
                metric={metric('activation_rate')}
                unit="/s"
              />
              <WarehouseMetricChart
                title="Worker start time"
                description="How long it takes a worker to start, split by kind and result."
                metric={metric('activation_duration_p95')}
                series={[
                  { metric: metric('activation_duration_mean'), label: 'Average' },
                  { metric: metric('activation_duration_p95'), label: 'p95' },
                ]}
                unit=" ms"
                scale={1000}
              />
            </div>
            <WarehouseMetricChart
              title="Requests by method"
              description="Requests per second, split by method and status. Not a count of SQL statements."
              metric={metric('rpc_rate')}
              unit="/s"
            />
            <WarehouseMetricChart
              title="Request duration"
              description="How long requests take to complete, split by method and status."
              metric={metric('rpc_duration_p95')}
              series={[
                { metric: metric('rpc_duration_mean'), label: 'Average' },
                { metric: metric('rpc_duration_p95'), label: 'p95' },
              ]}
              unit=" ms"
              scale={1000}
            />
          </div>
        )
      }
    }
  }

  return (
    <div className="relative">
      <p role="status" className="sr-only">
        {getWorkerStatus(query.status)}
      </p>
      {renderContent()}
    </div>
  )
}
