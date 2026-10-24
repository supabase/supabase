import { useState } from 'react'
import { Treemap } from 'recharts'
import { Button, ChartContainer, ChartTooltip, ChartTooltipContent } from 'ui'

import {
  getTreemapLabelLines,
  getTreemapTiles,
  relationSize,
  sizePercentage,
  type SizeMetric,
  type SizeTreemapTile,
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
  'var(--chart-muted)',
]
const metricLabels: Record<SizeMetric, string> = {
  total: 'Total size',
  table: 'Table size',
  index: 'Index size',
  toast: 'TOAST size',
}

const tileName = (tile: SizeTreemapTile) =>
  tile.schema ? `${tile.schema}.${tile.name}` : tile.name

const countLabel = (count: number, name: 'object' | 'schema') =>
  `${count} ${name}${count === 1 ? '' : 's'}`

const groupLabel = (tile: SizeTreemapTile) => {
  const count =
    tile.kind === 'schemas'
      ? countLabel(new Set(tile.members.map((member) => member.schema)).size, 'schema')
      : countLabel(tile.members.length, 'object')
  return `${tileName(tile)} (${count})`
}

function TreemapDetails({
  tile,
  metric,
  total,
}: {
  tile: SizeTreemapTile
  metric: SizeMetric
  total: number
}) {
  const schemaCount = new Set(tile.members.map((member) => member.schema)).size
  const objectCount = tile.members.length
  const table = tile.members.reduce((sum, member) => sum + member.table_bytes, 0)
  const index = tile.members.reduce((sum, member) => sum + member.index_bytes, 0)
  const toast = tile.members.reduce((sum, member) => sum + member.toast_bytes, 0)
  return (
    <div className="min-w-0 space-y-2 text-xs">
      <p className="break-all font-medium">{tileName(tile)}</p>
      <p>
        {metricLabels[metric]}: {formatBytes(tile.size)} ({sizePercentage(tile.size, total)} of
        selected metric)
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-foreground-light">
        <dt>Tables</dt>
        <dd className="text-right">{formatBytes(table)}</dd>
        <dt>Indexes</dt>
        <dd className="text-right">{formatBytes(index)}</dd>
        <dt>TOAST</dt>
        <dd className="text-right">{formatBytes(toast)}</dd>
      </dl>
      {tile.kind !== 'object' && (
        <div className="space-y-1 border-t pt-2">
          <p>
            {countLabel(objectCount, 'object')}
            {tile.kind === 'schemas'
              ? ` across ${countLabel(schemaCount, 'schema')}`
              : ` in ${tile.schema}`}
          </p>
          <ul className="space-y-1 text-foreground-light">
            {tile.members.slice(0, 5).map((member) => (
              <li key={member.id} className="flex justify-between gap-3">
                <span className="min-w-0 break-all">
                  {member.schema}.{member.name}
                </span>
                <span className="shrink-0">{formatBytes(relationSize(member, metric))}</span>
              </li>
            ))}
          </ul>
          {tile.members.length > 5 && (
            <p className="text-foreground-light">
              And {tile.members.length - 5} more{' '}
              {tile.members.length - 5 === 1 ? 'object' : 'objects'}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

const renderTreemapDetails = (tile: SizeTreemapTile, metric: SizeMetric, total: number) => (
  <TreemapDetails tile={tile} metric={metric} total={total} />
)

type TreemapTooltipProps = {
  active?: boolean
  payload?: { name?: string; value?: number; payload?: { tile?: SizeTreemapTile } }[]
  metric: SizeMetric
  total: number
}

function TreemapTooltip({ active, payload, metric, total }: TreemapTooltipProps) {
  const tile = payload?.[0]?.payload?.tile
  if (!active || !tile) return null
  return (
    <div role="tooltip">
      <ChartTooltipContent
        active={active}
        payload={payload?.map((item) => ({ ...item, dataKey: 'size' }))}
        hideLabel
        hideIndicator
        className="max-w-80"
        formatter={renderTreemapDetails.bind(null, tile, metric, total)}
      />
    </div>
  )
}

type TreemapTileProps = {
  x?: number
  y?: number
  width?: number
  height?: number
  tile?: SizeTreemapTile
  total: number
  onSelect: (id: string) => void
}

function TreemapTile({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  tile,
  total,
  onSelect,
}: TreemapTileProps) {
  if (!tile) return null
  const lines = getTreemapLabelLines(width, height)
  const isCompact = width < 140
  const name = tile.kind === 'object' ? tile.name : 'Other'
  const label = isCompact ? name : tileName(tile)
  const groupLabel = tile.kind === 'schemas' ? 'schemas' : 'objects'
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${tileName(tile)}: ${formatBytes(tile.size)}, ${sizePercentage(tile.size, total)}. Show size details`}
      onFocus={() => onSelect(tile.id)}
      onClick={() => onSelect(tile.id)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(tile.id)
        }
      }}
      className="cursor-pointer outline-none focus:[&_rect]:stroke-foreground"
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={`color-mix(in srgb, ${colors[tile.colorIndex]} 30%, var(--background-surface-100))`}
        stroke="var(--background-surface-100)"
        strokeWidth={3}
      />
      {lines > 0 && (
        <foreignObject
          x={x + 4}
          y={y + 4}
          width={Math.max(0, width - 8)}
          height={Math.max(0, height - 8)}
          className="pointer-events-none"
        >
          <div className="text-xs text-foreground">
            <p className="truncate font-medium">{label}</p>
            {lines >= 2 && isCompact && tile.kind !== 'object' && (
              <p className="truncate text-xs">{groupLabel}</p>
            )}
            {lines >= 2 && (!isCompact || tile.kind === 'object') && (
              <p className="truncate">{formatBytes(tile.size)}</p>
            )}
            {lines >= 3 && <p>{sizePercentage(tile.size, total)}</p>}
          </div>
        </foreignObject>
      )}
    </g>
  )
}

export function DatabaseSizeTreemap({
  relations,
  metric,
}: {
  relations: DatabaseSizeRelation[]
  metric: SizeMetric
}) {
  const [selectedId, setSelectedId] = useState<string>()
  const tiles = getTreemapTiles(relations, metric)
  const total = tiles.reduce((sum, tile) => sum + tile.size, 0)
  const selected = tiles.find((tile) => tile.id === selectedId)
  const groups = tiles.filter((tile) => tile.kind !== 'object')
  const data = tiles.map((tile) => ({ name: tile.id, size: tile.size, tile }))
  if (total === 0)
    return (
      <div className="flex h-80 items-center justify-center rounded border text-sm text-foreground-light">
        No objects use space for this metric.
      </div>
    )
  return (
    <div className="min-w-0 space-y-3">
      <ChartContainer
        config={{}}
        className="h-80 w-full aspect-auto rounded border bg-surface-100"
        aria-label="Database objects by size"
      >
        <Treemap
          data={data}
          dataKey="size"
          nameKey="name"
          isAnimationActive={false}
          isUpdateAnimationActive={false}
          content={<TreemapTile total={total} onSelect={setSelectedId} />}
        >
          <ChartTooltip content={<TreemapTooltip metric={metric} total={total} />} />
        </Treemap>
      </ChartContainer>
      {groups.length > 0 && (
        <div className="flex flex-wrap gap-2" aria-label="Grouped objects">
          {groups.map((tile) => (
            <Button
              key={tile.id}
              variant="outline"
              size="tiny"
              className="max-w-full min-w-0"
              aria-label={groupLabel(tile)}
              onClick={() => setSelectedId(tile.id)}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-sm"
                style={{
                  backgroundColor: `color-mix(in srgb, ${colors[tile.colorIndex]} 30%, var(--background-surface-100))`,
                }}
              />
              <span className="min-w-0 truncate">{groupLabel(tile)}</span>
            </Button>
          ))}
        </div>
      )}
      <div aria-live="polite" className="rounded border bg-surface-100 p-3">
        {selected ? (
          <TreemapDetails tile={selected} metric={metric} total={total} />
        ) : (
          <p className="text-xs text-foreground-light">
            Hover over an object to see its size. Select or focus an object to keep its details
            open.
          </p>
        )}
      </div>
    </div>
  )
}
