import { useMemo } from 'react'
import type { ChartConfig } from 'ui'
import { Card, CardContent } from 'ui'
import { Chart, ChartContent, ChartLine, ChartMetric, type ChartLineTick } from 'ui-patterns/Chart'
import { useSnapshot } from 'valtio'

import {
  buildTableOverviewSparklineData,
  parseTableSizeLabelToBytes,
  TABLE_COLUMN_COUNT_CHART_CONFIG,
  TABLE_ROW_COUNT_CHART_CONFIG,
  TABLE_SIZE_CHART_CONFIG,
} from '@/components/interfaces/Database/Tables/TableDetailOverview.utils'
import {
  formatWarehouseSize,
  resolveWarehouseTableState,
  useWarehouseTableState,
} from '@/components/interfaces/Database/Warehouse/warehouseDemoStore'
import {
  getSourceTableKey,
  getWarehouseQualifiedTableName,
} from '@/components/interfaces/Database/Warehouse/warehouseNaming.utils'
import type { TableLike } from '@/data/table-editor/table-editor-types'
import { formatBytes } from '@/lib/helpers'

const DATE_TIME_FORMAT = 'MMM D'

interface MetricTileProps {
  label: string
  value: string
  tooltip: string
  data: ChartLineTick[]
  dataKey: string
  config: ChartConfig
  tickFormatter?: (value: number) => string
}

function MetricTile({
  label,
  value,
  tooltip,
  data,
  dataKey,
  config,
  tickFormatter,
}: MetricTileProps) {
  return (
    <div className="flex min-w-0 flex-col gap-2 px-4 py-3">
      <ChartMetric label={label} value={value} tooltip={tooltip} className="[&_span]:text-sm" />
      <div className="h-12">
        <Chart>
          <ChartContent isEmpty={data.length === 0}>
            <ChartLine
              data={data}
              dataKey={dataKey}
              config={config}
              DateTimeFormat={DATE_TIME_FORMAT}
              className="h-12 gap-0"
              isFullHeight
              showYAxis={false}
              showGrid={false}
              YAxisProps={tickFormatter ? { tickFormatter } : undefined}
            />
          </ChartContent>
        </Chart>
      </div>
    </div>
  )
}

interface WarehouseTableDetailMetricsProps {
  table: TableLike
}

export function WarehouseTableDetailMetrics({ table }: WarehouseTableDetailMetricsProps) {
  const tableKey = getSourceTableKey(table.schema, table.name)
  const storedState = useWarehouseTableState(tableKey)
  const warehouseState = resolveWarehouseTableState(tableKey, storedState, {
    isWarehouseView: true,
  })

  const rowCount = table.live_rows_estimate ?? 0
  const columnCount = table.columns?.length ?? 0
  const warehouseSizeBytes =
    parseTableSizeLabelToBytes(table.size) ?? warehouseState.warehouseSizeBytes ?? 0
  const sizeLabel = table.size ?? formatWarehouseSize(warehouseState.warehouseSizeBytes)
  const qualifiedName = getWarehouseQualifiedTableName(tableKey)

  const chartData = useMemo(
    () =>
      buildTableOverviewSparklineData({
        tableId: table.id,
        rowCount,
        sizeBytes: warehouseSizeBytes || 1024,
        columnCount: columnCount || 1,
      }),
    [columnCount, rowCount, table.id, warehouseSizeBytes]
  )

  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <MetricTile
            label="Row count"
            value={rowCount.toLocaleString()}
            tooltip={`Estimated row count for ${qualifiedName}`}
            data={chartData}
            dataKey="row_count"
            config={TABLE_ROW_COUNT_CHART_CONFIG}
            tickFormatter={(value) => Number(value).toLocaleString()}
          />
          <MetricTile
            label="Warehouse size"
            value={sizeLabel}
            tooltip="On-disk size of the Warehouse copy"
            data={chartData}
            dataKey="table_size_bytes"
            config={TABLE_SIZE_CHART_CONFIG}
            tickFormatter={(value) => formatBytes(Number(value))}
          />
          <MetricTile
            label="Columns"
            value={columnCount.toLocaleString()}
            tooltip="Number of columns on this Warehouse copy"
            data={chartData}
            dataKey="column_count"
            config={TABLE_COLUMN_COUNT_CHART_CONFIG}
            tickFormatter={(value) => Number(value).toLocaleString()}
          />
        </div>
      </CardContent>
    </Card>
  )
}
