import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

import { formatWarehouseBytes, getWarehouseInlinedTableRows } from './WarehouseMetricChart.utils'
import { getEmptyMessage } from './WarehouseMetricsReport.utils'
import { NoDataPlaceholder } from '@/components/ui/Charts/NoDataPlaceholder'
import type { WarehouseMetric } from '@/data/warehouse/warehouse-metrics-api-types'

const MAX_ROWS = 10

export const WarehouseInlinedDataTable = ({
  metric,
  title,
  description,
}: {
  metric?: WarehouseMetric
  title: string
  description: string
}) => {
  const allRows = getWarehouseInlinedTableRows(metric)
  const rows = allRows.slice(0, MAX_ROWS)

  return (
    <section aria-label={title}>
      <Card>
        <CardContent className="flex flex-col gap-y-4 p-4">
          {rows.length > 0 ? (
            <>
              <h2 className="text-sm">{title}</h2>
              <p className="text-xs text-foreground-light">{description}</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead className="text-right">Latest</TableHead>
                    <TableHead className="text-right">Peak</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.key}>
                      <TableCell className="max-w-0 w-full">
                        <p className="truncate" title={row.name}>
                          {row.name}
                        </p>
                      </TableCell>
                      <TableCell className="text-right tabular-nums whitespace-nowrap">
                        {formatWarehouseBytes(row.latest)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums whitespace-nowrap">
                        {formatWarehouseBytes(row.peak)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <NoDataPlaceholder
              attribute={title}
              size="normal"
              hideTotalPlaceholder
              message={getEmptyMessage(metric)}
            />
          )}
          {allRows.length > rows.length && (
            <p className="text-xs text-foreground-light">
              Showing {rows.length} of {allRows.length} tables
            </p>
          )}
          {rows.length > 0 && metric?.availability === 'partial' && (
            <p className="text-xs text-foreground-light">Partial data</p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
