import { WarehouseMetricChart } from './WarehouseMetricChart'
import {
  formatWarehouseBytes,
  formatWarehouseBytesPerSecond,
  formatWarehouseDuration,
  formatWarehousePaused,
  formatWarehousePerSecond,
  WAREHOUSE_ETL_LABEL_PROPS,
} from './WarehouseMetricChart.utils'
import type { WarehouseMetricsRange } from './WarehouseMetrics.range'
import { WarehouseMetricsSection } from './WarehouseMetricsSection'
import type { WarehouseMetricName } from '@/data/warehouse/warehouse-metrics-api-types'

const REPLICATION_METRICS: WarehouseMetricName[] = [
  'ingestion_events_received_rate',
  'ingestion_events_processed_rate',
  'ingestion_bytes_received_rate',
  'ingestion_bytes_processed_rate',
  'replication_wal_lag_bytes',
  'replication_receive_wal_lag_bytes',
  'maintenance_pause_active',
  'maintenance_pause_duration_mean',
]

export const WarehouseReplicationSection = ({
  range,
}: {
  range: Extract<WarehouseMetricsRange, { status: 'ok' }>
}) => (
  <WarehouseMetricsSection
    title="Replication"
    description="How quickly changes from your database reach the Warehouse."
    statusLabel="replication"
    attributes={REPLICATION_METRICS}
    range={range}
  >
    {(getMetric) => (
      <>
        <WarehouseMetricChart
          {...WAREHOUSE_ETL_LABEL_PROPS}
          title="Replication lag"
          description="WAL not yet safely written to the Warehouse (replication lag) or not yet read from your database (receive lag). This is a size, not a time delay."
          metric={getMetric('replication_wal_lag_bytes')}
          series={[
            { metric: getMetric('replication_wal_lag_bytes'), label: 'Replication lag' },
            { metric: getMetric('replication_receive_wal_lag_bytes'), label: 'Receive lag' },
          ]}
          formatValue={formatWarehouseBytes}
        />
        <div className="grid gap-4 md:grid-cols-2">
          <WarehouseMetricChart
            {...WAREHOUSE_ETL_LABEL_PROPS}
            title="Change events"
            description="Events per second received from your database and accepted by the Warehouse."
            metric={getMetric('ingestion_events_processed_rate')}
            series={[
              { metric: getMetric('ingestion_events_received_rate'), label: 'Received' },
              { metric: getMetric('ingestion_events_processed_rate'), label: 'Processed' },
            ]}
            formatValue={formatWarehousePerSecond}
          />
          <WarehouseMetricChart
            {...WAREHOUSE_ETL_LABEL_PROPS}
            title="Change data"
            description="Bytes per second received from your database and accepted by the Warehouse, by change type."
            metric={getMetric('ingestion_bytes_processed_rate')}
            series={[
              { metric: getMetric('ingestion_bytes_received_rate'), label: 'Received' },
              { metric: getMetric('ingestion_bytes_processed_rate'), label: 'Processed' },
            ]}
            formatValue={formatWarehouseBytesPerSecond}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <WarehouseMetricChart
            {...WAREHOUSE_ETL_LABEL_PROPS}
            title="Paused for maintenance"
            description="Whether replication is paused while maintenance runs, by operation. A pause doesn't mean maintenance succeeded."
            metric={getMetric('maintenance_pause_active')}
            formatValue={formatWarehousePaused}
          />
          <WarehouseMetricChart
            {...WAREHOUSE_ETL_LABEL_PROPS}
            title="Pause duration"
            description="Average time replication stays paused, by operation and outcome. Operations that run together share one pause."
            metric={getMetric('maintenance_pause_duration_mean')}
            formatValue={formatWarehouseDuration}
          />
        </div>
      </>
    )}
  </WarehouseMetricsSection>
)
