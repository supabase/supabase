import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { Button } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { WarehouseMetricChart } from './WarehouseMetricChart'
import type { WarehouseMetricsRange } from './WarehouseMetrics.range'
import { AlertError } from '@/components/ui/AlertError'
import { warehouseMetricsQueryOptions } from '@/data/warehouse/warehouse-metrics-query'

export const WarehouseCapacitySection = ({
  range,
}: {
  range: Extract<WarehouseMetricsRange, { status: 'ok' }>
}) => {
  const { ref } = useParams()
  const query = useQuery(
    warehouseMetricsQueryOptions({
      projectRef: ref,
      attributes: [
        'worker_admission_limit',
        'worker_admission_occupied',
        'worker_admission_active',
        'worker_admission_pending',
        'admission_rejection_rate',
      ],
      startDate: range.startDate,
      endDate: range.endDate,
      interval: range.interval,
    })
  )
  const renderContent = () => {
    if (query.isPending) return <GenericSkeletonLoader aria-label="Loading capacity metrics" />
    if (query.isError)
      return (
        <AlertError
          projectRef={ref}
          error={query.error}
          subject="Failed to retrieve capacity metrics"
          additionalActions={<Button onClick={() => query.refetch()}>Retry</Button>}
        />
      )
    const metric = (name: string) => query.data.metrics.find((item) => item.metric === name)
    return (
      <div className="space-y-4">
        <h2 className="text-base">Capacity</h2>
        <WarehouseMetricChart
          title="Worker slots"
          description="Worker capacity grants in use or pending connection, compared with the slot limit. Grants are not SQL query counts."
          metric={metric('worker_admission_occupied')}
          series={[
            { metric: metric('worker_admission_limit'), label: 'Limit' },
            { metric: metric('worker_admission_occupied'), label: 'In use' },
            { metric: metric('worker_admission_active'), label: 'Active grants' },
            { metric: metric('worker_admission_pending'), label: 'Pending grants' },
          ]}
          unit=""
        />
        <WarehouseMetricChart
          title="Rejected requests"
          description="Requests per second turned away before they could run, split by reason."
          metric={metric('admission_rejection_rate')}
          unit="/s"
        />
      </div>
    )
  }
  return (
    <div className="relative">
      <p role="status" className="sr-only">
        {query.isPending && <span>Loading capacity metrics</span>}
        {query.isSuccess && <span>Capacity metrics loaded</span>}
      </p>
      {renderContent()}
    </div>
  )
}
