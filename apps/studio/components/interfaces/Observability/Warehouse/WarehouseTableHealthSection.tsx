import { WarehouseMetricChart } from './WarehouseMetricChart'
import {
  formatWarehouseBytes,
  formatWarehouseCount,
  formatWarehouseRatio,
  WAREHOUSE_ETL_LABEL_PROPS,
} from './WarehouseMetricChart.utils'
import type { WarehouseMetricsRange } from './WarehouseMetrics.range'
import { WarehouseMetricsSection } from './WarehouseMetricsSection'
import type { WarehouseMetricName } from '@/data/warehouse/warehouse-metrics-api-types'

const TABLE_HEALTH_METRICS: WarehouseMetricName[] = [
  'table_active_data_files_mean',
  'table_active_delete_files_mean',
  'table_active_data_bytes_mean',
  'table_active_delete_bytes_mean',
  'table_active_data_file_avg_size_bytes_mean',
  'table_small_file_ratio_mean',
  'table_deleted_row_ratio_mean',
]

export const WarehouseTableHealthSection = ({
  range,
}: {
  range: Extract<WarehouseMetricsRange, { status: 'ok' }>
}) => (
  <WarehouseMetricsSection
    title="Table health"
    description="Averages of periodic samples across your tables, not current totals. Samples can lag behind recent changes."
    statusLabel="table health"
    attributes={TABLE_HEALTH_METRICS}
    range={range}
  >
    {(getMetric) => (
      <div className="grid gap-4 md:grid-cols-2">
        <WarehouseMetricChart
          {...WAREHOUSE_ETL_LABEL_PROPS}
          title="Files per table"
          description="Average data files and delete files per table."
          metric={getMetric('table_active_data_files_mean')}
          series={[
            { metric: getMetric('table_active_data_files_mean'), label: 'Data files' },
            { metric: getMetric('table_active_delete_files_mean'), label: 'Delete files' },
          ]}
          formatValue={formatWarehouseCount}
        />
        <WarehouseMetricChart
          {...WAREHOUSE_ETL_LABEL_PROPS}
          title="Size per table"
          description="Average size of data files and delete files per table."
          metric={getMetric('table_active_data_bytes_mean')}
          series={[
            { metric: getMetric('table_active_data_bytes_mean'), label: 'Data files' },
            { metric: getMetric('table_active_delete_bytes_mean'), label: 'Delete files' },
          ]}
          formatValue={formatWarehouseBytes}
        />
        <WarehouseMetricChart
          {...WAREHOUSE_ETL_LABEL_PROPS}
          title="Average file size"
          description="Average data file size. Many small files can slow queries until maintenance compacts them."
          metric={getMetric('table_active_data_file_avg_size_bytes_mean')}
          formatValue={formatWarehouseBytes}
        />
        <WarehouseMetricChart
          {...WAREHOUSE_ETL_LABEL_PROPS}
          title="Small files and deleted rows"
          description="Average share of small data files and deleted rows per table. Maintenance compacts files as these grow."
          metric={getMetric('table_small_file_ratio_mean')}
          series={[
            { metric: getMetric('table_small_file_ratio_mean'), label: 'Small files' },
            { metric: getMetric('table_deleted_row_ratio_mean'), label: 'Deleted rows' },
          ]}
          formatValue={formatWarehouseRatio}
        />
      </div>
    )}
  </WarehouseMetricsSection>
)
