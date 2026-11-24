import { Card, CardContent } from 'ui'

import { WarehouseMetricChart } from './WarehouseMetricChart'
import {
  formatWarehouseBytes,
  formatWarehouseCount,
  formatWarehouseDuration,
  WAREHOUSE_ETL_LABEL_PROPS,
} from './WarehouseMetricChart.utils'
import type { WarehouseMetricsRange } from './WarehouseMetrics.range'
import { hasAnyValues } from './WarehouseMetricsReport.utils'
import { WarehouseMetricsSection } from './WarehouseMetricsSection'
import { NoDataPlaceholder } from '@/components/ui/Charts/NoDataPlaceholder'
import type { WarehouseMetricName } from '@/data/warehouse/warehouse-metrics-api-types'

const CATALOG_METRICS: WarehouseMetricName[] = [
  'catalog_active_data_files',
  'catalog_snapshots',
  'catalog_deletion_backlog_files',
  'catalog_deletion_backlog_bytes',
  'catalog_oldest_snapshot_age',
  'catalog_oldest_deletion_age',
]

export const WarehouseCatalogSection = ({
  range,
}: {
  range: Extract<WarehouseMetricsRange, { status: 'ok' }>
}) => (
  <WarehouseMetricsSection
    title="Catalog"
    description="Snapshots and files tracked by the Warehouse catalog. Reported only when the catalog belongs to this project alone."
    statusLabel="catalog"
    attributes={CATALOG_METRICS}
    range={range}
  >
    {(getMetric, data) => {
      // These measurements are unavailable until catalog ownership is attested, so most projects
      // see no values at all.
      if (!data.metrics.some(hasAnyValues)) {
        return (
          <Card>
            <CardContent className="p-4">
              <NoDataPlaceholder
                size="normal"
                message="No catalog metrics in the selected period"
              />
            </CardContent>
          </Card>
        )
      }
      return (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <WarehouseMetricChart
              {...WAREHOUSE_ETL_LABEL_PROPS}
              title="Data files"
              description="Active data files in the catalog."
              metric={getMetric('catalog_active_data_files')}
              formatValue={formatWarehouseCount}
            />
            <WarehouseMetricChart
              {...WAREHOUSE_ETL_LABEL_PROPS}
              title="Snapshots"
              description="Snapshots retained in the catalog."
              metric={getMetric('catalog_snapshots')}
              formatValue={formatWarehouseCount}
            />
            <WarehouseMetricChart
              {...WAREHOUSE_ETL_LABEL_PROPS}
              title="Deletion backlog"
              description="Files scheduled for deletion."
              metric={getMetric('catalog_deletion_backlog_files')}
              formatValue={formatWarehouseCount}
            />
            <WarehouseMetricChart
              {...WAREHOUSE_ETL_LABEL_PROPS}
              title="Deletion backlog size"
              description="Size of files scheduled for deletion, not space already reclaimed."
              metric={getMetric('catalog_deletion_backlog_bytes')}
              formatValue={formatWarehouseBytes}
            />
          </div>
          <WarehouseMetricChart
            {...WAREHOUSE_ETL_LABEL_PROPS}
            title="Oldest snapshot and deletion"
            description="Age of the oldest retained snapshot and the oldest scheduled deletion."
            metric={getMetric('catalog_oldest_snapshot_age')}
            series={[
              { metric: getMetric('catalog_oldest_snapshot_age'), label: 'Oldest snapshot' },
              {
                metric: getMetric('catalog_oldest_deletion_age'),
                label: 'Oldest scheduled deletion',
              },
            ]}
            formatValue={formatWarehouseDuration}
          />
        </>
      )
    }}
  </WarehouseMetricsSection>
)
