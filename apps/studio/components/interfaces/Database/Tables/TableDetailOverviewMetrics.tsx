import type { ReactNode } from 'react'
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
} from './TableDetailOverview.utils'
import {
  getWarehouseStorageSummaryLabel,
  warehouseDemoStore,
} from '@/components/interfaces/Database/Warehouse/warehouseDemoStore'
import type { TableLike } from '@/data/table-editor/table-editor-types'
import { formatBytes } from '@/lib/helpers'

const DATE_TIME_FORMAT = 'MMM D'

interface TableOverviewMetricTileProps {
  label: string
  value: string
  tooltip: string
  data: ChartLineTick[]
  dataKey: string
  config: ChartConfig
  tickFormatter?: (value: number) => string
}

function TableOverviewMetricTile({
  label,
  value,
  tooltip,
  data,
  dataKey,
  config,
  tickFormatter,
}: TableOverviewMetricTileProps) {
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

interface TableDetailOverviewMetricsProps {
  table: TableLike
}

export function TableDetailOverviewMetrics({ table }: TableDetailOverviewMetricsProps) {
  const warehouseSnap = useSnapshot(warehouseDemoStore)
  const tableKey = `${table.schema}.${table.name}`
  const warehouseState = warehouseSnap.tables[tableKey]

  const rowCount = table.live_rows_estimate ?? 0
  const columnCount = table.columns?.length ?? 0
  const postgresSizeBytes = parseTableSizeLabelToBytes(table.size)
  const warehouseSizeBytes = warehouseState?.warehouseSizeBytes ?? 0
  const warehouseMode = warehouseState?.mode ?? 'postgres'
  const sizeBytes =
    warehouseMode === 'has_warehouse_copy'
      ? postgresSizeBytes + warehouseSizeBytes
      : postgresSizeBytes
  const sizeLabel =
    getWarehouseStorageSummaryLabel(warehouseState, table.size) ??
    table.size ??
    formatBytes(sizeBytes)

  const chartData = useMemo(
    () =>
      buildTableOverviewSparklineData({
        tableId: table.id,
        rowCount,
        sizeBytes: sizeBytes || postgresSizeBytes || 1024,
        columnCount: columnCount || 1,
      }),
    [columnCount, rowCount, sizeBytes, postgresSizeBytes, table.id]
  )

  const tiles: ReactNode[] = [
    <TableOverviewMetricTile
      key="rows"
      label="Row count"
      value={rowCount.toLocaleString()}
      tooltip="Estimated live row count from Postgres table statistics"
      data={chartData}
      dataKey="row_count"
      config={TABLE_ROW_COUNT_CHART_CONFIG}
      tickFormatter={(value) => Number(value).toLocaleString()}
    />,
    <TableOverviewMetricTile
      key="size"
      label="Table size"
      value={sizeLabel}
      tooltip="On-disk size including indexes. Warehouse copy size is included when present."
      data={chartData}
      dataKey="table_size_bytes"
      config={TABLE_SIZE_CHART_CONFIG}
      tickFormatter={(value) => formatBytes(Number(value))}
    />,
    <TableOverviewMetricTile
      key="columns"
      label="Columns"
      value={columnCount.toLocaleString()}
      tooltip="Number of columns defined on this table"
      data={chartData}
      dataKey="column_count"
      config={TABLE_COLUMN_COUNT_CHART_CONFIG}
      tickFormatter={(value) => Number(value).toLocaleString()}
    />,
  ]

  return (
    <Card>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {tiles}
        </div>
      </CardContent>
    </Card>
  )
}
