import { WarehouseMetricChart } from './WarehouseMetricChart'
import {
  formatWarehouseBytes,
  formatWarehouseCount,
  formatWarehouseDuration,
  formatWarehousePerMinute,
  WAREHOUSE_ETL_LABEL_PROPS,
} from './WarehouseMetricChart.utils'
import type { WarehouseMetricsRange } from './WarehouseMetrics.range'
import { WarehouseMetricsSection } from './WarehouseMetricsSection'
import type { WarehouseMetricName } from '@/data/warehouse/warehouse-metrics-api-types'

const INLINED_DATA_METRICS: WarehouseMetricName[] = [
  'table_inlined_data_bytes',
  'inline_flush_rows_rate',
  'inline_flush_rows_mean',
  'inline_flush_duration_mean',
]

export const WarehouseInlinedDataSection = ({
  range,
}: {
  range: Extract<WarehouseMetricsRange, { status: 'ok' }>
}) => (
  <WarehouseMetricsSection
    title="Inlined data"
    description="Small writes are stored in the catalog first, then flushed to data files."
    statusLabel="inlined data"
    attributes={INLINED_DATA_METRICS}
    range={range}
  >
    {(getMetric) => (
      <div className="grid gap-4 md:grid-cols-2">
        <WarehouseMetricChart
          {...WAREHOUSE_ETL_LABEL_PROPS}
          title="Inlined data by table"
          description="Inlined data not yet flushed to data files, for the largest tables at the end of the period. Values come from periodic samples."
          metric={getMetric('table_inlined_data_bytes')}
          formatValue={formatWarehouseBytes}
        />
        <WarehouseMetricChart
          {...WAREHOUSE_ETL_LABEL_PROPS}
          title="Rows flushed"
          description="Inlined rows flushed per minute, by result."
          metric={getMetric('inline_flush_rows_rate')}
          formatValue={formatWarehousePerMinute}
        />
        <WarehouseMetricChart
          {...WAREHOUSE_ETL_LABEL_PROPS}
          title="Rows per flush"
          description="Average rows written by each flush, by result."
          metric={getMetric('inline_flush_rows_mean')}
          formatValue={formatWarehouseCount}
        />
        <WarehouseMetricChart
          {...WAREHOUSE_ETL_LABEL_PROPS}
          title="Flush duration"
          description="Average time each flush takes, by result."
          metric={getMetric('inline_flush_duration_mean')}
          formatValue={formatWarehouseDuration}
        />
      </div>
    )}
  </WarehouseMetricsSection>
)
