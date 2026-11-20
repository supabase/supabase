import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { WarehouseMetricChart } from './WarehouseMetricChart'
import type { WarehouseMetricsRange } from './WarehouseMetrics.range'
import { AlertError } from '@/components/ui/AlertError'
import type { WarehouseMetricName } from '@/data/warehouse/warehouse-metrics-api-types'
import { warehouseMetricsQueryOptions } from '@/data/warehouse/warehouse-metrics-query'

const getCapacityStatus = (view: 'pending' | 'error' | 'success') => {
  switch (view) {
    case 'pending':
      return 'Loading capacity metrics'
    case 'error':
      return 'Could not load capacity metrics'
    case 'success':
      return 'Capacity metrics loaded'
  }
}

const CAPACITY_METRICS: WarehouseMetricName[] = [
  'worker_admission_limit',
  'worker_admission_occupied',
  'worker_admission_active',
  'worker_admission_pending',
  'admission_rejection_rate',
]

export const WarehouseCapacitySection = ({
  range,
}: {
  range: Extract<WarehouseMetricsRange, { status: 'ok' }>
}) => {
  const { ref } = useParams()

  const query = useQuery(
    warehouseMetricsQueryOptions({
      projectRef: ref,
      attributes: CAPACITY_METRICS,
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
        {getCapacityStatus(query.status)}
      </p>
      <h2 className="text-base">Capacity</h2>
      {query.isPending && <GenericSkeletonLoader aria-label="Loading capacity metrics" />}
      {query.isError && (
        <AlertError
          projectRef={ref}
          error={query.error}
          subject="Failed to retrieve capacity metrics"
          additionalActions={<Button onClick={() => query.refetch()}>Retry</Button>}
        />
      )}
      {query.isSuccess && (
        <>
          <WarehouseMetricChart
            title="Worker slots"
            description="Worker capacity grants in use or pending connection, compared with the slot limit. Grants are not SQL query counts."
            metric={getMetric('worker_admission_occupied')}
            series={[
              { metric: getMetric('worker_admission_limit'), label: 'Limit' },
              { metric: getMetric('worker_admission_occupied'), label: 'In use' },
              { metric: getMetric('worker_admission_active'), label: 'Active grants' },
              { metric: getMetric('worker_admission_pending'), label: 'Pending grants' },
            ]}
          />
          <WarehouseMetricChart
            title="Rejected requests"
            description="Requests per second turned away before they could run, split by reason."
            metric={getMetric('admission_rejection_rate')}
            unit="/s"
          />
        </>
      )}
    </div>
  )
}
