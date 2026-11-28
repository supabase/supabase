import { WarehouseMetricChart } from './WarehouseMetricChart'
import { formatWarehousePerMinute, WAREHOUSE_ETL_LABEL_PROPS } from './WarehouseMetricChart.utils'
import type { WarehouseMetricsRange } from './WarehouseMetrics.range'
import { WarehouseMetricsSection } from './WarehouseMetricsSection'
import type { WarehouseMetricName } from '@/data/warehouse/warehouse-metrics-api-types'

const MAINTENANCE_METRICS: WarehouseMetricName[] = [
  'maintenance_run_rate',
  'maintenance_request_rate',
  'maintenance_merge_adjacent_files_created_rate',
  'maintenance_rewrite_data_files_created_rate',
  'maintenance_expired_snapshots_rate',
  'maintenance_cleaned_up_files_rate',
]

export const WarehouseMaintenanceSection = ({
  range,
}: {
  range: Extract<WarehouseMetricsRange, { status: 'ok' }>
}) => (
  <WarehouseMetricsSection
    title="Maintenance"
    description="Background jobs that compact data files and clean up old snapshots and files."
    statusLabel="maintenance"
    attributes={MAINTENANCE_METRICS}
    range={range}
  >
    {(getMetric) => (
      <div className="grid gap-4 md:grid-cols-2">
        <WarehouseMetricChart
          {...WAREHOUSE_ETL_LABEL_PROPS}
          title="Maintenance runs"
          description="Completed runs per minute, by trigger and outcome."
          metric={getMetric('maintenance_run_rate')}
          formatValue={formatWarehousePerMinute}
        />
        <WarehouseMetricChart
          {...WAREHOUSE_ETL_LABEL_PROPS}
          title="Maintenance requests"
          description="Requests per minute, by operation and reason. Several requests can be handled by one run."
          metric={getMetric('maintenance_request_rate')}
          formatValue={formatWarehousePerMinute}
        />
        <WarehouseMetricChart
          {...WAREHOUSE_ETL_LABEL_PROPS}
          title="Files written"
          description="Files created per minute by successful merge and rewrite operations. Input files aren't counted."
          metric={getMetric('maintenance_rewrite_data_files_created_rate')}
          series={[
            {
              metric: getMetric('maintenance_merge_adjacent_files_created_rate'),
              label: 'Merged',
            },
            {
              metric: getMetric('maintenance_rewrite_data_files_created_rate'),
              label: 'Rewritten',
            },
          ]}
          formatValue={formatWarehousePerMinute}
        />
        <WarehouseMetricChart
          {...WAREHOUSE_ETL_LABEL_PROPS}
          title="Cleanup"
          description="Snapshots expired and files removed per minute by successful runs. Reported only when the catalog belongs to this project alone."
          metric={getMetric('maintenance_cleaned_up_files_rate')}
          series={[
            { metric: getMetric('maintenance_expired_snapshots_rate'), label: 'Snapshots expired' },
            { metric: getMetric('maintenance_cleaned_up_files_rate'), label: 'Files removed' },
          ]}
          formatValue={formatWarehousePerMinute}
        />
      </div>
    )}
  </WarehouseMetricsSection>
)
