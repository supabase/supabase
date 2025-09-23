import type { Edge, Node } from 'reactflow'
import { useMemo } from 'react'

import type { PlanMeta, PlanNodeData } from '../types'

type SidebarMetricKey = 'time' | 'rows' | 'cost' | 'buffers' | 'io'

type SidebarRow = {
  id: string
  node: Node<PlanNodeData>
  depth: number
  index: number
  isLast: boolean
  branchTrail: boolean[]
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

type LegendItem = {
  id: string
  label: string
  color: string
}

type MetricLegend = {
  items: LegendItem[]
} | null

type UseMetricsSidebarDataArgs = {
  nodes: Node<PlanNodeData>[]
  edges: Edge[]
  meta?: PlanMeta
  activeMetric: SidebarMetricKey
}

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

const METRIC_LEGENDS: Record<SidebarMetricKey, MetricLegend> = {
  time: null,
  rows: null,
  cost: null,
  buffers: {
    items: [
      { id: 'buffers-shared', label: 'Shared', color: 'bg-foreground' },
      { id: 'buffers-temp', label: 'Temp', color: 'bg-warning' },
      { id: 'buffers-local', label: 'Local', color: 'bg-brand-400 dark:bg-brand-500' },
    ],
  },
  io: {
    items: [
      { id: 'io-read', label: 'Read', color: 'bg-foreground' },
      { id: 'io-write', label: 'Write', color: 'bg-warning' },
    ],
  },
}

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

    const loops = Math.max(data.actualLoops ?? 1, 1)
    const actualTotalRows = data.estActualTotalRows ?? (data.actualRows ?? 0) * loops
    if (actualTotalRows > maxRows) maxRows = actualTotalRows

    const planTotalRows = (data.planRows ?? 0) * loops
    if (planTotalRows > maxRows) maxRows = planTotalRows

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

const getTreeGuidePrefix = (branchTrail: boolean[], isLast: boolean): string => {
  if (branchTrail.length === 0) return ''

  const ancestors = branchTrail.slice(0, -1)
  const connector = isLast ? '└─' : '├─'
  const prefix = `${ancestors.map((hasNext) => (hasNext ? '│ ' : '  ')).join('')}${connector} `

  return prefix.replace(/ /g, '\u00A0')
}

export const useMetricsSidebarData = ({
  nodes,
  edges,
  meta,
  activeMetric,
}: UseMetricsSidebarDataArgs) => {
  const rows = useMemo(() => computeRows(nodes, edges), [nodes, edges])
  const stats = useMemo(() => computeStats(nodes, meta), [nodes, meta])
  const legend = METRIC_LEGENDS[activeMetric]

  return {
    rows,
    stats,
    legend,
    metricOptions: METRIC_OPTIONS,
  }
}

export type { BufferBreakdown, LegendItem, MetricStats, SidebarMetricKey, SidebarRow }
export { computeBufferBreakdown, getTreeGuidePrefix }
