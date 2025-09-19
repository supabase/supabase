import { useMemo, useState, type ReactNode } from 'react'
import type { Edge, Node } from 'reactflow'
import { Layers } from 'lucide-react'

import type { PlanMeta, PlanNodeData } from './types'
import { Button, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { formatMs, formatNumber, blocksToBytes } from './utils/formats'

type SidebarMetricKey = 'time' | 'rows' | 'cost' | 'buffers' | 'io'

type SidebarRow = {
  id: string
  node: Node<PlanNodeData>
  depth: number
  index: number
  isLast: boolean
  branchTrail: boolean[]
}

type MetricsSidebarProps = {
  nodes: Node<PlanNodeData>[]
  edges: Edge[]
  meta?: PlanMeta
  selectedNodeId?: string | null
  onSelect?: (node: Node<PlanNodeData>) => void
}

type MetricStats = {
  totalTime: number
  maxRows: number
  maxExclusiveCost: number
  maxBufferTotal: number
  maxIO: number
}

type BufferBreakdown = {
  shared: number
  temp: number
  local: number
  total: number
}

type MetricRenderResult = {
  visual: ReactNode | null
  tooltip: ReactNode | null
}

type MetricRenderer = (data: PlanNodeData, stats: MetricStats) => MetricRenderResult

const METRIC_OPTIONS: { key: SidebarMetricKey; label: string; description: string }[] = [
  {
    key: 'time',
    label: 'Time',
    description:
      'Shows how long each plan step took. The first bar segment is time spent in this step; the second segment adds time from its child steps.',
  },
  {
    key: 'rows',
    label: 'Rows',
    description: 'Shows how many rows the step actually produced versus what the planner expected.',
  },
  {
    key: 'cost',
    label: 'Cost',
    description:
      "Shows the planner's cost estimate for each step. Useful for spotting operations the planner thinks are expensive.",
  },
  {
    key: 'buffers',
    label: 'Buffers',
    description:
      'Shows how many data blocks the step touched, split across shared cache, temp spill, and local buffers.',
  },
  {
    key: 'io',
    label: 'IO',
    description: 'Shows how much time the step spent waiting on storage reads and writes.',
  },
]

const parsePath = (id: string): number[] => {
  if (id === 'root') return []
  return id
    .split('-')
    .slice(1)
    .map((part) => {
      const parsed = Number(part)
      return Number.isNaN(parsed) ? 0 : parsed
    })
}

const comparePath = (a: string, b: string) => {
  const pa = parsePath(a)
  const pb = parsePath(b)
  const len = Math.max(pa.length, pb.length)
  for (let i = 0; i < len; i++) {
    const va = pa[i] ?? -1
    const vb = pb[i] ?? -1
    if (va !== vb) return va - vb
  }
  return 0
}

const computeRows = (nodes: Node<PlanNodeData>[], edges: Edge[]): SidebarRow[] => {
  if (!nodes.length) return []

  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const childrenMap = new Map<string, string[]>()
  edges.forEach((edge) => {
    if (!edge.source || !edge.target) return
    if (!childrenMap.has(edge.source)) childrenMap.set(edge.source, [])
    childrenMap.get(edge.source)!.push(edge.target)
  })
  childrenMap.forEach((list, key) => {
    list.sort(comparePath)
    childrenMap.set(key, list)
  })

  const root = nodeMap.get('root') ?? nodes[0]
  const rows: SidebarRow[] = []
  let counter = 0

  const traverse = (id: string, depth: number, branchTrail: boolean[], isLast: boolean) => {
    const node = nodeMap.get(id)
    if (!node) return

    rows.push({
      id,
      node,
      depth,
      index: ++counter,
      isLast,
      branchTrail,
    })

    const childIds = childrenMap.get(id) ?? []
    const nextTrail = [...branchTrail, !isLast]
    childIds.forEach((childId, idx) => {
      const childIsLast = idx === childIds.length - 1
      traverse(childId, depth + 1, nextTrail, childIsLast)
    })
  }

  traverse(root.id, 0, [], true)

  return rows
}

const computeStats = (nodes: Node<PlanNodeData>[], meta?: PlanMeta): MetricStats => {
  let totalTime = meta?.executionTime ?? 0
  let maxRows = 0
  let maxExclusiveCost = 0
  let maxBufferTotal = 0
  let maxIO = 0

  nodes.forEach((node) => {
    const data = node.data
    const exclusiveTime = data.exclusiveTimeMs ?? 0
    if (!meta?.executionTime) {
      totalTime += exclusiveTime
    }

    const actualTotalRows =
      data.estActualTotalRows ?? (data.actualRows ?? 0) * (data.actualLoops ?? 1)
    if (actualTotalRows > maxRows) maxRows = actualTotalRows

    const exclusiveCost = data.exclusiveCost ?? 0
    if (exclusiveCost > maxExclusiveCost) maxExclusiveCost = exclusiveCost

    const bufferBreakdown = computeBufferBreakdown(data)
    if (bufferBreakdown.total > maxBufferTotal) maxBufferTotal = bufferBreakdown.total

    const ioTotal = (data.ioReadTime ?? 0) + (data.ioWriteTime ?? 0)
    if (ioTotal > maxIO) maxIO = ioTotal
  })

  if (totalTime <= 0) {
    totalTime = nodes.reduce((sum, node) => sum + (node.data.exclusiveTimeMs ?? 0), 0)
  }

  return {
    totalTime,
    maxRows,
    maxExclusiveCost,
    maxBufferTotal,
    maxIO,
  }
}

const computeBufferBreakdown = (data: PlanNodeData): BufferBreakdown => {
  const shared =
    (data.exSharedHit ?? 0) +
    (data.exSharedRead ?? 0) +
    (data.exSharedDirtied ?? 0) +
    (data.exSharedWritten ?? 0)
  const temp = (data.exTempRead ?? 0) + (data.exTempWritten ?? 0)
  const local =
    (data.exLocalHit ?? 0) +
    (data.exLocalRead ?? 0) +
    (data.exLocalDirtied ?? 0) +
    (data.exLocalWritten ?? 0)
  const total = shared + temp + local

  return { shared, temp, local, total }
}

const MetricBar = ({
  percent,
  secondaryPercent = 0,
  color = 'bg-foreground',
  secondaryColor = 'bg-foreground-muted',
}: {
  percent: number
  secondaryPercent?: number
  color?: string
  secondaryColor?: string
}) => {
  const primaryWidth = Math.max(Math.min(percent, 100), 0)
  const secondaryWidth = Math.max(Math.min(secondaryPercent, 100 - primaryWidth), 0)

  return (
    <div className="flex h-2 overflow-hidden rounded-sm bg-border w-full">
      <div
        className={cn('h-full transition-[width] duration-300', color)}
        style={{ width: `${primaryWidth}%` }}
      />
      {secondaryWidth > 0 ? (
        <div
          className={cn('h-full transition-[width] duration-300 opacity-80', secondaryColor)}
          style={{ width: `${secondaryWidth}%` }}
        />
      ) : null}
    </div>
  )
}

const BufferBar = ({
  sharedPercent,
  tempPercent,
  localPercent,
}: {
  sharedPercent: number
  tempPercent: number
  localPercent: number
}) => {
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-sm bg-border">
      <div className="h-full bg-foreground" style={{ width: `${Math.min(sharedPercent, 100)}%` }} />
      <div className="h-full bg-warning" style={{ width: `${Math.min(tempPercent, 100)}%` }} />
      <div className="h-full bg-info" style={{ width: `${Math.min(localPercent, 100)}%` }} />
    </div>
  )
}

const TreeGuide = ({ branchTrail, isLast }: { branchTrail: boolean[]; isLast: boolean }) => {
  if (branchTrail.length === 0) return null

  const ancestors = branchTrail.slice(0, -1)
  const connector = isLast ? '└─ ' : '├─ '
  const prefix = `${ancestors.map((hasNext) => (hasNext ? '│  ' : '   ')).join('')}${connector}`

  return (
    <span className="font-mono text-[11px] text-foreground-muted whitespace-pre">{prefix}</span>
  )
}

const renderTimeMetric: MetricRenderer = (data, stats) => {
  const exclusive = data.exclusiveTimeMs ?? 0
  const inclusive = Math.max((data.actualTotalTime ?? 0) * (data.actualLoops ?? 1) - exclusive, 0)
  const totalPercent = stats.totalTime > 0 ? (exclusive / stats.totalTime) * 100 : 0
  const secondaryPercent = stats.totalTime > 0 ? (inclusive / stats.totalTime) * 100 : 0
  const formattedExclusive = formatMs(exclusive)
  const loops = data.actualLoops ?? 1
  const totalPerLoop =
    data.actualTotalTime !== undefined
      ? data.actualTotalTime
      : loops > 0
        ? exclusive / loops
        : exclusive
  const formattedTotalPerLoop = formatMs(totalPerLoop)
  const totalCombined = totalPerLoop * Math.max(loops, 0)
  const formattedTotalCombined = loops > 1 ? formatMs(totalCombined) : undefined
  const formattedLoops = loops > 1 ? formatNumber(loops) ?? `${loops}` : undefined

  return {
    visual: (
      <MetricBar
        percent={totalPercent}
        secondaryPercent={secondaryPercent}
        color="bg-foreground"
        secondaryColor="bg-foreground-muted"
      />
    ),
    tooltip: (
      <ul className="list-disc -space-y-0.5 pl-4 text-foreground-light">
        <li>
          <span className="font-medium">Time spent in this step only:</span>{' '}
          <span className="text-foreground">
            {formattedExclusive ? `${formattedExclusive} ms` : '0 ms'}
          </span>
        </li>
        <li>
          <span className="font-medium">Total including child steps:</span>{' '}
          <span className="text-foreground">
            {formattedTotalPerLoop ? `${formattedTotalPerLoop} ms` : '0 ms'}
          </span>
          {formattedLoops ? (
            <>
              {' '}
              per loop · ran <span className="text-foreground">{formattedLoops} loops</span>
            </>
          ) : null}
        </li>
        {formattedLoops && formattedTotalCombined ? (
          <li>
            <span className="font-medium">All loops combined:</span>{' '}
            <span className="text-foreground">{formattedTotalCombined} ms</span>
          </li>
        ) : null}
      </ul>
    ),
  }
}

const renderRowsMetric: MetricRenderer = (data, stats) => {
  const actualTotalRows =
    data.estActualTotalRows ?? (data.actualRows ?? 0) * (data.actualLoops ?? 1)
  const percent = stats.maxRows > 0 ? (actualTotalRows / stats.maxRows) * 100 : 0
  const formattedActualRows = formatNumber(actualTotalRows) ?? '0'
  const formattedPlanRows =
    data.planRows !== undefined ? formatNumber(data.planRows) ?? `${data.planRows}` : undefined

  return {
    visual: <MetricBar percent={percent} />,
    tooltip: (
      <ul className="list-disc -space-y-0.5 pl-4 text-foreground-lighter">
        <li>
          <span className="font-medium">Rows produced by this step:</span>{' '}
          <span className="text-foreground">{formattedActualRows}</span>
        </li>
        {formattedPlanRows ? (
          <li>
            <span className="font-medium">Planner expected:</span>{' '}
            <span className="text-foreground">{formattedPlanRows}</span>
          </li>
        ) : null}
      </ul>
    ),
  }
}

const renderCostMetric: MetricRenderer = (data, stats) => {
  const exclusiveCost = data.exclusiveCost ?? 0
  const percent = stats.maxExclusiveCost > 0 ? (exclusiveCost / stats.maxExclusiveCost) * 100 : 0

  return {
    visual: <MetricBar percent={percent} />,
    tooltip: (
      <ul className="-space-y-0.5 text-foreground-light">
        <li>
          <span className="font-medium">Planner cost for this step:</span>{' '}
          <span className="text-foreground">{exclusiveCost.toFixed(2)}</span>
        </li>
        <li>* Cost units are planner estimates, not milliseconds.</li>
      </ul>
    ),
  }
}

const renderBuffersMetric: MetricRenderer = (data, stats) => {
  const breakdown = computeBufferBreakdown(data)

  if (breakdown.total <= 0) {
    return {
      visual: <span className="text-[11px] text-foreground-light">No buffers</span>,
      tooltip: null,
    }
  }

  const totalPercent = stats.maxBufferTotal > 0 ? (breakdown.total / stats.maxBufferTotal) * 100 : 0
  const sharedPercent =
    breakdown.total > 0 ? (breakdown.shared / breakdown.total) * totalPercent : 0
  const tempPercent = breakdown.total > 0 ? (breakdown.temp / breakdown.total) * totalPercent : 0
  const localPercent = breakdown.total > 0 ? (breakdown.local / breakdown.total) * totalPercent : 0

  return {
    visual: (
      <BufferBar
        sharedPercent={sharedPercent}
        tempPercent={tempPercent}
        localPercent={localPercent}
      />
    ),
    tooltip: (
      <ul className="list-disc -space-y-0.5 pl-4 text-foreground-light">
        <li>
          <span className="font-medium">Shared cache (global):</span>{' '}
          <span className="text-foreground">{formatNumber(breakdown.shared) ?? '0'} blocks</span>{' '}
          <span className="text-foreground-light">({blocksToBytes(breakdown.shared)})</span>
        </li>
        <li>
          <span className="font-medium">Temp spill (disk):</span>{' '}
          <span className="text-foreground">{formatNumber(breakdown.temp) ?? '0'} blocks</span>{' '}
          <span className="text-foreground-light">({blocksToBytes(breakdown.temp)})</span>
        </li>
        <li>
          <span className="font-medium">Local buffers (per worker):</span>{' '}
          <span className="text-foreground">{formatNumber(breakdown.local) ?? '0'} blocks</span>{' '}
          <span className="text-foreground-light">({blocksToBytes(breakdown.local)})</span>
        </li>
        <li>
          <span className="font-medium">This step total:</span>{' '}
          <span className="text-foreground">{formatNumber(breakdown.total) ?? '0'} blocks</span>{' '}
          <span className="text-foreground-light">({blocksToBytes(breakdown.total)})</span>
        </li>
      </ul>
    ),
  }
}

const renderIOMetric: MetricRenderer = (data, stats) => {
  const read = data.ioReadTime ?? 0
  const write = data.ioWriteTime ?? 0
  const total = read + write

  if (total <= 0) {
    return {
      visual: <span className="text-[11px] text-foreground-light">No IO timing</span>,
      tooltip: null,
    }
  }

  const percent = stats.maxIO > 0 ? (total / stats.maxIO) * 100 : 0
  const readPercent = total > 0 ? (read / total) * percent : 0
  const writePercent = total > 0 ? (write / total) * percent : 0

  return {
    visual: <BufferBar sharedPercent={readPercent} tempPercent={writePercent} localPercent={0} />,
    tooltip: (
      <ul className="list-disc -space-y-0.5 pl-4 text-foreground-light">
        <li>
          <span className="font-medium">Reading from storage:</span>{' '}
          <span className="text-foreground">{formatMs(read) ?? '0'} ms</span>
        </li>
        <li>
          <span className="font-medium">Writing to storage:</span>{' '}
          <span className="text-foreground">{formatMs(write) ?? '0'} ms</span>
        </li>
        <li>
          <span className="font-medium">Note:</span> Values include every loop for this node
        </li>
      </ul>
    ),
  }
}

const METRIC_RENDERERS: Record<SidebarMetricKey, MetricRenderer> = {
  time: renderTimeMetric,
  rows: renderRowsMetric,
  cost: renderCostMetric,
  buffers: renderBuffersMetric,
  io: renderIOMetric,
}

const hasTooltipContent = (content: ReactNode | null) =>
  content !== null && content !== undefined && content !== false && content !== ''

export const MetricsSidebar = ({
  nodes,
  edges,
  meta,
  selectedNodeId,
  onSelect,
}: MetricsSidebarProps) => {
  const [activeMetric, setActiveMetric] = useState<SidebarMetricKey>('time')

  const rows = useMemo(() => computeRows(nodes, edges), [nodes, edges])
  const stats = useMemo(() => computeStats(nodes, meta), [nodes, meta])

  if (!rows.length) return null

  return (
    <aside className="hidden lg:flex w-72 flex-col border-r border-border bg-sidebar">
      <div className="h-[41px] flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          <Layers size={14} />
          <span>Metrics</span>
        </div>
        <span className="text-[11px] text-foreground-light">{rows.length} nodes</span>
      </div>
      <div className="flex gap-2 px-3 py-2 border-b justify-between">
        {METRIC_OPTIONS.map((option) => (
          <Tooltip key={option.key}>
            <TooltipTrigger asChild>
              <Button
                type={activeMetric === option.key ? 'default' : 'dashed'}
                size="tiny"
                className="px-2 py-1"
                onClick={() => setActiveMetric(option.key)}
              >
                {option.label}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[220px] text-[11px] leading-relaxed">
              {option.description}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-y-1">
          {rows.map((row) => {
            const { node, branchTrail, isLast } = row
            const data = node.data
            const isActive = selectedNodeId === node.id
            const { visual, tooltip } = METRIC_RENDERERS[activeMetric](data, stats)
            const hasTooltip = hasTooltipContent(tooltip)

            const buttonBody = (
              <button
                type="button"
                className="w-full py-0 px-1 text-xs"
                onClick={() => onSelect?.(node)}
              >
                <div className="flex items-center gap-x-1 h-[24px]">
                  <TreeGuide branchTrail={branchTrail} isLast={isLast} />
                  <span className="flex-1 min-w-0 font-medium text-[11px] text-left text-foreground">
                    {data.label}
                  </span>
                  {visual ? <div className="flex-none w-[120px]">{visual}</div> : null}
                </div>
              </button>
            )

            return (
              <li
                key={row.id}
                className={cn(
                  'rounded border border-transparent transition-colors flex px-1 hover:border-border hover:bg-surface-100',
                  isActive && 'border-stronger bg-surface-100'
                )}
              >
                {hasTooltip ? (
                  <Tooltip>
                    <TooltipTrigger asChild>{buttonBody}</TooltipTrigger>
                    <TooltipContent side="left" className="text-[11px]">
                      {tooltip}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  buttonBody
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </aside>
  )
}
