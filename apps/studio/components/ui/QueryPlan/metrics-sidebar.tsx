import { useState, type ReactNode } from 'react'
import type { Edge, Node } from 'reactflow'

import type { PlanMeta, PlanNodeData } from './types'
import { Button, ResizablePanel, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { formatMs, formatNumber, blocksToBytes } from './utils/formats'
import { MetricBar, SegmentedBar, type SegmentedBarSegment } from './components/metric-bars'
import { MetricLegend } from './components/metric-legend'
import {
  computeBufferBreakdown,
  getTreeGuidePrefix,
  type MetricStats,
  type SidebarMetricKey,
  useMetricsSidebarData,
} from './hooks/use-metrics-sidebar-data'

type MetricsSidebarProps = {
  nodes: Node<PlanNodeData>[]
  edges: Edge[]
  meta?: PlanMeta
  selectedNodeId?: string | null
  onSelect: (node: Node<PlanNodeData>) => void
  defaultSize?: number
  minSize?: number
  maxSize?: number
}

type MetricRenderResult = {
  visual: ReactNode | null
  tooltip: ReactNode | null
}

type MetricRenderer = (data: PlanNodeData, stats: MetricStats) => MetricRenderResult

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
          {formattedLoops && (
            <>
              {' '}
              per loop · ran <span className="text-foreground">{formattedLoops} loops</span>
            </>
          )}
        </li>
        {formattedLoops && formattedTotalCombined && (
          <li>
            <span className="font-medium">All loops combined:</span>{' '}
            <span className="text-foreground">{formattedTotalCombined} ms</span>
          </li>
        )}
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
        {formattedPlanRows && (
          <li>
            <span className="font-medium">Planner expected:</span>{' '}
            <span className="text-foreground">{formattedPlanRows}</span>
          </li>
        )}
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

  const segments: SegmentedBarSegment[] = [
    { id: 'buffers-shared-bar', percent: sharedPercent, color: 'bg-foreground' },
    { id: 'buffers-temp-bar', percent: tempPercent, color: 'bg-warning' },
    { id: 'buffers-local-bar', percent: localPercent, color: 'bg-brand-400 dark:bg-brand-500' },
  ]

  return {
    visual: <SegmentedBar segments={segments} />,
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

  const segments: SegmentedBarSegment[] = [
    { id: 'io-read-bar', percent: readPercent, color: 'bg-foreground' },
    { id: 'io-write-bar', percent: writePercent, color: 'bg-warning' },
  ]

  return {
    visual: <SegmentedBar segments={segments} />,
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
  defaultSize = 20,
  minSize = 20,
  maxSize = 45,
}: MetricsSidebarProps) => {
  const [activeMetric, setActiveMetric] = useState<SidebarMetricKey>('time')

  const { rows, stats, legend, metricOptions } = useMetricsSidebarData({
    nodes,
    edges,
    meta,
    activeMetric,
  })

  if (!rows.length) return null

  return (
    <ResizablePanel
      defaultSize={defaultSize}
      minSize={minSize}
      maxSize={maxSize}
      collapsible
      className="hidden md:flex min-w-[300px] flex-col bg-sidebar"
    >
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="text-xs font-medium">
          <span>Metrics</span>
        </div>
        <span className="text-[11px] text-foreground-light">{rows.length} nodes</span>
      </div>
      <div className="px-3 py-2 border-b overflow-x-auto">
        <div className="flex gap-2 justify-between max-w-[320px] mx-auto">
          {metricOptions.map((option) => (
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
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {legend && <MetricLegend items={legend.items} />}

        <ul className="flex flex-col gap-y-0.5">
          {rows.map((row) => {
            const { node, branchTrail, isLast } = row
            const data = node.data
            const isActive = selectedNodeId === node.id
            const { visual, tooltip } = METRIC_RENDERERS[activeMetric](data, stats)
            const hasTooltip = hasTooltipContent(tooltip)

            const treePrefix = getTreeGuidePrefix(branchTrail, isLast)

            const buttonBody = (
              <Button
                type="default"
                size="tiny"
                onClick={() => onSelect(node)}
                className={cn(
                  'w-full py-0 px-1 text-xs block bg-sidebar dark:bg-sidebar border border-transparent transition-colors rounded hover:border-border hover:bg-surface-100 dark:hover:bg-surface-100',
                  isActive && 'border-stronger bg-surface-100 dark:bg-surface-100'
                )}
              >
                <div className="grid h-[24px] w-full grid-cols-[minmax(0,1fr),120px] items-center gap-x-2">
                  <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left text-[11px]">
                    {treePrefix && (
                      <span aria-hidden className="font-mono text-foreground-lighter">
                        {treePrefix}
                      </span>
                    )}
                    <span className="font-medium text-foreground">{data.label}</span>
                  </span>
                  {visual && <div className="w-[120px]">{visual}</div>}
                </div>
              </Button>
            )

            return (
              <li key={row.id}>
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
    </ResizablePanel>
  )
}
