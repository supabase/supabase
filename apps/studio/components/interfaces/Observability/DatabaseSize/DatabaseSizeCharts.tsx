import { Cell, Pie, PieChart } from 'recharts'
import { ChartContainer } from 'ui'

import { relationSize, sizePercentage, type SizeMetric } from './DatabaseSize.utils'
import { DatabaseSizeTreemap } from './DatabaseSizeTreemap'
import type { DatabaseSizeRelation } from '@/data/database/database-size-breakdown-query'
import { formatBytes } from '@/lib/helpers'

const colors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
]

export function DatabaseSizeCharts({
  relations,
  metric,
}: {
  relations: DatabaseSizeRelation[]
  metric: SizeMetric
}) {
  const breakdown = [
    {
      name: 'Tables',
      value: relations.reduce((sum, row) => sum + row.table_bytes, 0),
      color: colors[0],
    },
    {
      name: 'Indexes',
      value: relations.reduce((sum, row) => sum + row.index_bytes, 0),
      color: colors[1],
    },
    {
      name: 'TOAST',
      value: relations.reduce((sum, row) => sum + row.toast_bytes, 0),
      color: colors[2],
    },
  ]
  const snapshotTotal = relations.reduce(
    (sum, relation) => sum + relationSize(relation, 'total'),
    0
  )

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px]">
      <DatabaseSizeTreemap relations={relations} metric={metric} />
      <div className="rounded border bg-surface-100 p-4">
        <h3 className="text-sm font-medium">Object type breakdown</h3>
        <div className="relative h-48">
          <ChartContainer
            config={{
              tables: { label: 'Tables', color: colors[0] },
              indexes: { label: 'Indexes', color: colors[1] },
              toast: { label: 'TOAST', color: colors[2] },
            }}
            className="h-full w-full aspect-auto"
          >
            <PieChart accessibilityLayer>
              <Pie
                data={breakdown}
                dataKey="value"
                nameKey="name"
                innerRadius="65%"
                outerRadius="90%"
                stroke="none"
                isAnimationActive={false}
              >
                {breakdown.map((item) => (
                  <Cell key={item.name} fill={item.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-sm">
            <strong>{formatBytes(snapshotTotal)}</strong>
            <span className="text-foreground-light">objects</span>
          </div>
        </div>
        <ul className="space-y-2 text-xs">
          {breakdown.map((item) => (
            <li key={item.name} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.name}</span>
              <span className="ml-auto">{formatBytes(item.value)}</span>
              <span className="w-12 text-right text-foreground-light">
                {sizePercentage(item.value, snapshotTotal)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
