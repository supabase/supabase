import { useMemo, useState, type ReactNode } from 'react'
import type { Edge, Node } from 'reactflow'
import { Layers } from 'lucide-react'

import type { PlanMeta, PlanNodeData } from './types'
import { Button, Progress, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
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
  selectedNode?: PlanNodeData | null
  onSelect?: (node: PlanNodeData) => void
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

const METRIC_OPTIONS: { key: SidebarMetricKey; label: string }[] = [
  { key: 'time', label: 'time' },
  { key: 'rows', label: 'rows' },
  { key: 'cost', label: 'cost' },
  { key: 'buffers', label: 'buffers' },
  { key: 'io', label: 'IO' },
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
  color = 'bg-brand',
  secondaryColor = 'bg-foreground-muted',
}: {
  percent: number
  secondaryPercent?: number
  color?: string
  secondaryColor?: string
}) => {
  const primaryWidth = Math.max(Math.min(percent, 100), 0)
  const secondaryWidth = Math.max(Math.min(secondaryPercent, 100 - primaryWidth), 0)
  const totalWidth = Math.min(primaryWidth + secondaryWidth, 100)

  return (
    <div className="relative h-2 w-full">
      <Progress
        value={totalWidth}
        className="!h-full w-full overflow-hidden !rounded-sm !bg-border"
        indicatorClassName={cn('duration-300 opacity-80', secondaryColor)}
      />
      <div className="pointer-events-none absolute inset-0">
        <Progress
          value={primaryWidth}
          className="!h-full w-full overflow-hidden !rounded-sm !bg-transparent"
          indicatorClassName={cn('duration-300', color)}
        />
      </div>
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
      <div className="h-full bg-brand/70" style={{ width: `${Math.min(sharedPercent, 100)}%` }} />
      <div className="h-full bg-warning/70" style={{ width: `${Math.min(tempPercent, 100)}%` }} />
      <div
        className="h-full bg-foreground-muted"
        style={{ width: `${Math.min(localPercent, 100)}%` }}
      />
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

const renderMetricCellForMode = (
  data: PlanNodeData,
  stats: MetricStats,
  metric: SidebarMetricKey,
  mode: 'visual' | 'tooltip'
): ReactNode => {
  switch (metric) {
    case 'time': {
      const exclusive = data.exclusiveTimeMs ?? 0
      const inclusive = Math.max(
        (data.actualTotalTime ?? 0) * (data.actualLoops ?? 1) - exclusive,
        0
      )
      const totalPercent = stats.totalTime > 0 ? (exclusive / stats.totalTime) * 100 : 0
      const secondaryPercent = stats.totalTime > 0 ? (inclusive / stats.totalTime) * 100 : 0
      const formattedExclusive = formatMs(exclusive)

      if (mode === 'tooltip') {
        return <span>Exclusive {formattedExclusive ? `${formattedExclusive} ms` : '0 ms'}</span>
      }

      return (
        <MetricBar
          percent={totalPercent}
          secondaryPercent={secondaryPercent}
          color="bg-brand"
          secondaryColor="bg-brand/30"
        />
      )
    }
    case 'rows': {
      const actualTotalRows =
        data.estActualTotalRows ?? (data.actualRows ?? 0) * (data.actualLoops ?? 1)
      const percent = stats.maxRows > 0 ? (actualTotalRows / stats.maxRows) * 100 : 0
      if (mode === 'tooltip') {
        return (
          <span>
            Actual {formatNumber(actualTotalRows) ?? '0'}
            {data.planRows !== undefined ? ` · Est ${formatNumber(data.planRows)}` : ''}
          </span>
        )
      }
      return <MetricBar percent={percent} color="bg-brand" />
    }
    case 'cost': {
      const exclusiveCost = data.exclusiveCost ?? 0
      const percent =
        stats.maxExclusiveCost > 0 ? (exclusiveCost / stats.maxExclusiveCost) * 100 : 0
      if (mode === 'tooltip') {
        return <span>Self cost {exclusiveCost.toFixed(2)}</span>
      }
      return <MetricBar percent={percent} color="bg-brand" />
    }
    case 'buffers': {
      const breakdown = computeBufferBreakdown(data)
      if (breakdown.total <= 0) {
        if (mode === 'tooltip') return null
        return <span className="text-[11px] text-foreground-light">No buffers</span>
      }
      const totalPercent =
        stats.maxBufferTotal > 0 ? (breakdown.total / stats.maxBufferTotal) * 100 : 0
      const sharedPercent =
        breakdown.total > 0 ? (breakdown.shared / breakdown.total) * totalPercent : 0
      const tempPercent =
        breakdown.total > 0 ? (breakdown.temp / breakdown.total) * totalPercent : 0
      const localPercent =
        breakdown.total > 0 ? (breakdown.local / breakdown.total) * totalPercent : 0

      if (mode === 'tooltip') {
        return (
          <div className="space-y-1">
            <div>
              Shared {formatNumber(breakdown.shared) ?? '0'} · Temp{' '}
              {formatNumber(breakdown.temp) ?? '0'} · Local {formatNumber(breakdown.local) ?? '0'}{' '}
              blocks
            </div>
            <div className="text-[10px] text-foreground-light">
              Total {formatNumber(breakdown.total) ?? '0'} blocks ({blocksToBytes(breakdown.total)})
            </div>
          </div>
        )
      }

      return (
        <BufferBar
          sharedPercent={sharedPercent}
          tempPercent={tempPercent}
          localPercent={localPercent}
        />
      )
    }
    case 'io': {
      const read = data.ioReadTime ?? 0
      const write = data.ioWriteTime ?? 0
      const total = read + write
      if (total <= 0) {
        if (mode === 'tooltip') return null
        return <span className="text-[11px] text-foreground-light">No IO timing</span>
      }
      const percent = stats.maxIO > 0 ? (total / stats.maxIO) * 100 : 0
      const readPercent = total > 0 ? (read / total) * percent : 0
      const writePercent = total > 0 ? (write / total) * percent : 0

      if (mode === 'tooltip') {
        return (
          <span>
            Read {formatMs(read) ?? '0'} ms · Write {formatMs(write) ?? '0'} ms
          </span>
        )
      }

      return <BufferBar sharedPercent={readPercent} tempPercent={writePercent} localPercent={0} />
    }
    default:
      return null
  }
}

export const MetricsSidebar = ({
  nodes,
  edges,
  meta,
  selectedNode,
  onSelect,
}: MetricsSidebarProps) => {
  const [activeMetric, setActiveMetric] = useState<SidebarMetricKey>('time')

  const rows = useMemo(() => computeRows(nodes, edges), [nodes, edges])
  const stats = useMemo(() => computeStats(nodes, meta), [nodes, meta])

  if (!rows.length) return null

  return (
    <aside className="hidden lg:flex w-72 flex-col border-r border-border bg-background">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-alternative">
        <div className="flex items-center gap-2 text-xs font-medium text-foreground">
          <Layers size={14} />
          <span>Metrics</span>
        </div>
        <span className="text-[11px] text-foreground-light">{rows.length} nodes</span>
      </div>
      <div className="flex gap-2 px-3 py-2 border-b border-border justify-between">
        {METRIC_OPTIONS.map((option) => (
          <Button
            key={option.key}
            type={activeMetric === option.key ? 'default' : 'dashed'}
            size="tiny"
            className="px-2 py-1"
            onClick={() => setActiveMetric(option.key)}
          >
            {option.label}
          </Button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col">
          {rows.map((row) => {
            const { node, branchTrail, isLast } = row
            const data = node.data
            const isActive = selectedNode && selectedNode === data
            const visual = renderMetricCellForMode(data, stats, activeMetric, 'visual')
            const tooltip = renderMetricCellForMode(data, stats, activeMetric, 'tooltip')
            const hasTooltip = tooltip !== null && tooltip !== undefined && tooltip !== ''

            const buttonBody = (
              <button
                type="button"
                className="w-full py-0 px-1 text-xs"
                onClick={() => onSelect?.(data)}
              >
                <div className="flex items-center gap-x-1 h-[16px]">
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
                  'rounded border border-transparent transition-colors',
                  isActive ? 'border-brand bg-brand/10' : 'hover:border-border'
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
