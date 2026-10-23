import { Cell, Pie, PieChart } from 'recharts'
import { ChartContainer } from 'ui'

import {
  getTreemapGroups,
  partitionTreemap,
  relationSize,
  sizePercentage,
  type SizeMetric,
} from './DatabaseSize.utils'
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
  const groups = getTreemapGroups(relations, metric)
  const total = groups.reduce((sum, group) => sum + group.size, 0)
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
      <div
        className="relative h-80 rounded border bg-surface-100 overflow-hidden"
        role="img"
        aria-label={`Schema treemap: ${formatBytes(total)} across ${groups.length} schemas`}
      >
        {total === 0 && (
          <p className="p-6 text-sm text-foreground-light">No objects use space for this metric.</p>
        )}
        {partitionTreemap(groups).map((group) => (
          <div
            key={group.name}
            className="absolute p-1"
            style={{
              left: `${group.x}%`,
              top: `${group.y}%`,
              width: `${group.width}%`,
              height: `${group.height}%`,
            }}
          >
            <div className="flex h-full flex-col gap-1 rounded bg-surface-200 p-2 overflow-hidden">
              <p
                className="truncate text-xs font-medium"
                title={`${group.name}: ${formatBytes(group.size)} (${sizePercentage(group.size, total)})`}
              >
                {group.name}{' '}
                <span className="text-foreground-light">
                  {formatBytes(group.size)} ({sizePercentage(group.size, total)})
                </span>
              </p>
              <div className="relative min-h-0 flex-1">
                {partitionTreemap(group.children).map((object, index) => (
                  <div
                    key={`${object.isOther}-${object.name}`}
                    className="absolute p-0.5"
                    style={{
                      left: `${object.x}%`,
                      top: `${object.y}%`,
                      width: `${object.width}%`,
                      height: `${object.height}%`,
                    }}
                  >
                    <div
                      className="h-full rounded p-2 overflow-hidden"
                      style={{
                        backgroundColor: object.isOther ? 'var(--chart-muted)' : colors[index],
                      }}
                      title={`${group.name}.${object.name}: ${formatBytes(object.size)} (${sizePercentage(object.size, total)})`}
                    >
                      <div className="truncate text-xs font-medium text-foreground">
                        {object.name}
                      </div>
                      <div className="truncate text-xs text-foreground">
                        {formatBytes(object.size)}
                      </div>
                      <div className="truncate text-xs text-foreground-light">
                        {sizePercentage(object.size, total)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
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
