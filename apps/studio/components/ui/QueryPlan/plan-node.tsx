import { type ReactNode, useContext } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import {
  Workflow,
  TimerOff,
  Clock,
  Rows3,
  CircleDollarSign,
  Layers,
  Table,
  Columns3,
} from 'lucide-react'

import type { PlanNodeData } from './types'
import { Badge, cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { NodeItem } from './node-item'
import { Heatmap } from './heatmap'
import { HeatmapContext, MetricsVisibilityContext, type MetricsVisibility } from './contexts'
import {
  DEFAULT_NODE_HEIGHT_CONSTANTS,
  DEFAULT_NODE_WIDTH,
  HIDDEN_NODE_CONNECTOR,
} from './constants'
import {
  computeHeaderLines,
  hasShared,
  hasTemp,
  hasLocal,
  sharedTooltip,
  localTooltip,
  tempTooltip,
  removedPercentValue,
  buildHints,
} from './utils/node-display'
import { formatMs, formatNumber, formatOrDash } from './utils/formats'

type MetricRow = {
  id: string
  condition: boolean
  element: ReactNode
  icon?: ReactNode
  tooltip?: ReactNode
}

const hintSeverityHighlightClass = (severity?: 'warn' | 'alert') => {
  if (severity === 'alert') return 'font-semibold text-destructive'
  if (severity === 'warn') return 'font-semibold text-warning'
  return undefined
}

const metricsListData = (data: PlanNodeData, metricsVisibility: MetricsVisibility): MetricRow[] => {
  const formattedLoops =
    data.actualLoops !== undefined
      ? formatNumber(data.actualLoops) ?? `${data.actualLoops}`
      : undefined
  const loopsSuffix =
    formattedLoops !== undefined
      ? `ran ${formattedLoops} time${data.actualLoops === 1 ? '' : 's'}`
      : ''
  const formattedTotalTime = formatMs(data.actualTotalTime)
  const formattedSelfTime = formatMs(data.exclusiveTimeMs)

  const actualRows = data.actualRows !== undefined ? formatOrDash(data.actualRows) : data.actualRows
  const estimatedRows = data.planRows !== undefined ? formatOrDash(data.planRows) : data.planRows

  const filterPercent = removedPercentValue(data, data.rowsRemovedByFilter)
  const joinFilterPercent = removedPercentValue(data, data.rowsRemovedByJoinFilter)
  const recheckPercent = removedPercentValue(data, data.rowsRemovedByIndexRecheck)
  const slowHighlightClass = data.slowHint
    ? hintSeverityHighlightClass(data.slowHint.severity)
    : undefined
  const costHighlightClass = data.costHint
    ? hintSeverityHighlightClass(data.costHint.severity)
    : undefined

  return [
    {
      id: 'workers',
      condition: !(data.workersPlanned === undefined && data.workersLaunched === undefined),
      tooltip: (
        <div className="space-y-1">
          <p>Postgres can launch helper processes to run this step in parallel.</p>
          <p className="font-semibold">
            Planned = expected helpers, Started = helpers that actually ran.
          </p>
        </div>
      ),
      element: (
        <>
          <span>Parallel helpers</span>
          <span className="flex flex-row items-center flex-1 justify-end gap-x-2">
            <span>Planned: {formatOrDash(data.workersPlanned)}</span>
            <span>Started: {formatOrDash(data.workersLaunched)}</span>
          </span>
        </>
      ),
    },
    {
      id: 'time',
      condition: metricsVisibility.time && data.actualTotalTime !== undefined,
      tooltip: 'Time spent on this step including any child steps.',
      icon: <Clock size={10} strokeWidth={1} className="mr-1" />,
      element: (
        <>
          <span>Total time</span>
          <span className="flex items-center gap-x-1 ml-auto">
            <span>{formattedTotalTime ?? data.actualTotalTime} ms</span>
            <span className="text-foreground-light">({loopsSuffix})</span>
          </span>
        </>
      ),
    },
    {
      id: 'time-self',
      condition: metricsVisibility.time && data.exclusiveTimeMs !== undefined,
      tooltip: 'Time spent only inside this node. Child steps are not included.',
      icon: <Clock size={10} strokeWidth={1} className="mr-1" />,
      element: (
        <>
          <span>Step time</span>
          <span className={cn('ml-auto', slowHighlightClass)}>
            {formattedSelfTime ?? data.exclusiveTimeMs} ms
          </span>
        </>
      ),
    },
    {
      id: 'rows',
      condition:
        metricsVisibility.rows && (data.actualRows !== undefined || data.planRows !== undefined),
      tooltip: 'Rows processed versus what the planner expected.',
      icon: <Rows3 size={10} strokeWidth={1} className="mr-1" />,
      element: (
        <>
          <span>Rows seen</span>
          <span className="flex items-center gap-x-1 ml-auto">
            <span>{actualRows !== undefined ? actualRows : '-'}</span>
            {estimatedRows !== undefined ? (
              <span className="text-foreground-light">(expected {estimatedRows})</span>
            ) : (
              ''
            )}
          </span>
        </>
      ),
    },
    {
      id: 'removed-filter',
      condition: metricsVisibility.rows && data.rowsRemovedByFilter !== undefined,
      tooltip: 'Rows skipped because a WHERE or filter condition returned false.',
      icon: <Rows3 size={10} strokeWidth={1} className="mr-1" />,
      element: (
        <>
          <span>Filtered out rows</span>
          <span className="flex items-center gap-x-1 ml-auto">
            <span>{formatOrDash(data.rowsRemovedByFilter)}</span>
            {filterPercent !== undefined ? (
              <span className="text-foreground-light">({filterPercent}%)</span>
            ) : (
              ''
            )}
          </span>
        </>
      ),
    },
    {
      id: 'removed-join-filter',
      condition: metricsVisibility.rows && data.rowsRemovedByJoinFilter !== undefined,
      tooltip: 'Rows dropped because the join filter did not match.',
      icon: <Rows3 size={10} strokeWidth={1} className="mr-1" />,
      element: (
        <>
          <span>Join filter drops</span>
          <span className="flex items-center gap-x-1 ml-auto">
            <span>{formatOrDash(data.rowsRemovedByJoinFilter)}</span>
            {joinFilterPercent !== undefined ? (
              <span className="text-foreground-light">({joinFilterPercent}%)</span>
            ) : (
              ''
            )}
          </span>
        </>
      ),
    },
    {
      id: 'removed-index-recheck',
      condition: metricsVisibility.rows && data.rowsRemovedByIndexRecheck !== undefined,
      tooltip: 'Rows removed after an index recheck (commonly due to visibility rules).',
      icon: <Rows3 size={10} strokeWidth={1} className="mr-1" />,
      element: (
        <>
          <span>Index recheck drops</span>
          <span className="flex items-center gap-x-1 ml-auto">
            <span>{formatOrDash(data.rowsRemovedByIndexRecheck)}</span>
            {recheckPercent !== undefined ? (
              <span className="text-foreground-light">({recheckPercent}%)</span>
            ) : (
              ''
            )}
          </span>
        </>
      ),
    },
    {
      id: 'plan-width',
      condition: metricsVisibility.rows && data.planWidth !== undefined,
      tooltip: 'Average bytes per row output by this step.',
      icon: <Rows3 size={10} strokeWidth={1} className="mr-1" />,
      element: (
        <>
          <span>Row size</span>
          <span className="ml-auto">{formatOrDash(data.planWidth)} bytes</span>
        </>
      ),
    },
    {
      id: 'cost',
      condition: metricsVisibility.cost && data.totalCost !== undefined,
      tooltip: 'Planner cost units (not milliseconds). Shows the total cost.',
      icon: <CircleDollarSign size={10} strokeWidth={1} className="mr-1" />,
      element: (
        <>
          <span>Planner cost</span>
          <span className="ml-auto">{formatOrDash(data.totalCost)}</span>
        </>
      ),
    },
    {
      id: 'cost-self',
      condition: metricsVisibility.cost && data.exclusiveCost !== undefined,
      tooltip: 'Portion of the planner cost assigned only to this step.',
      icon: <CircleDollarSign size={10} strokeWidth={1} className="mr-1" />,
      element: (
        <>
          <span>Self cost</span>
          <span className={cn('ml-auto', costHighlightClass)}>
            {data.exclusiveCost?.toFixed(2)}
          </span>
        </>
      ),
    },
    {
      id: 'heap-fetches',
      condition: metricsVisibility.buffers && data.heapFetches !== undefined,
      tooltip: 'Rows fetched directly from the table because they were not already in cache.',
      icon: <Layers size={10} strokeWidth={1} className="mr-1" />,
      element: (
        <>
          <span>Table fetches</span>
          <span className="ml-auto">{formatOrDash(data.heapFetches)}</span>
        </>
      ),
    },
    {
      id: 'shared-buffers',
      condition: metricsVisibility.buffers && hasShared(data),
      tooltip: (
        <div className="space-y-1">
          <p>Shared cache blocks touched (all runs vs. just this node).</p>
          <span className="block font-mono whitespace-pre-wrap">{sharedTooltip(data)}</span>
        </div>
      ),
      icon: <Layers size={10} strokeWidth={1} className="mr-1" />,
      element: (
        <>
          <span>Shared cache (self)</span>
          <span className="ml-auto">
            h:{data.exSharedHit ?? 0} r:{data.exSharedRead ?? 0} d:{data.exSharedDirtied ?? 0} w:
            {data.exSharedWritten ?? 0}
          </span>
        </>
      ),
    },
    {
      id: 'temp-buffers',
      condition: metricsVisibility.buffers && hasTemp(data),
      tooltip: (
        <div className="space-y-1">
          <p>Temporary blocks written to disk for this step.</p>
          <span className="block font-mono whitespace-pre-wrap">{tempTooltip(data)}</span>
        </div>
      ),
      icon: <Layers size={10} strokeWidth={1} className="mr-1" />,
      element: (
        <>
          <span>Temporary blocks (self)</span>
          <span className="ml-auto">
            r:{data.exTempRead ?? 0} w:{data.exTempWritten ?? 0}
          </span>
        </>
      ),
    },
    {
      id: 'local-buffers',
      condition: metricsVisibility.buffers && hasLocal(data),
      tooltip: (
        <div className="space-y-1">
          <p>Local cache blocks touched (per worker memory).</p>
          <span className="block font-mono whitespace-pre-wrap">{localTooltip(data)}</span>
        </div>
      ),
      icon: <Layers size={10} strokeWidth={1} className="mr-1" />,
      element: (
        <>
          <span>Local cache (self)</span>
          <span className="ml-auto">
            h:{data.exLocalHit ?? 0} r:{data.exLocalRead ?? 0} d:{data.exLocalDirtied ?? 0} w:
            {data.exLocalWritten ?? 0}
          </span>
        </>
      ),
    },
    {
      id: 'output-cols',
      condition:
        metricsVisibility.output && Array.isArray(data.outputCols) && data.outputCols.length > 0,
      icon: <Columns3 size={10} strokeWidth={1} className="mr-1" />,
      tooltip: (
        <div className="space-y-1">
          <p>Columns passed to the next step.</p>
          <span className="block whitespace-pre-wrap">{data.outputCols?.join(', ')}</span>
        </div>
      ),
      element: (
        <>
          <span>Columns returned</span>
          <span className="truncate max-w-[95px] ml-auto">{data.outputCols?.join(', ')}</span>
        </>
      ),
    },
    {
      id: 'io-times',
      condition:
        metricsVisibility.output &&
        (data.ioReadTime !== undefined || data.ioWriteTime !== undefined),
      tooltip: 'Time spent performing disk reads and writes for this step.',
      icon: <Table size={10} strokeWidth={1} className="mr-1" />,
      element: (
        <>
          <span>Disk I/O time</span>
          <span className="ml-auto">
            {data.ioReadTime !== undefined ? `read ${data.ioReadTime}ms` : ''}
            {data.ioWriteTime !== undefined
              ? `${data.ioReadTime !== undefined ? ' · ' : ''}write ${data.ioWriteTime}ms`
              : ''}
          </span>
        </>
      ),
    },
  ]
}

export const PlanNode = ({ data, selected }: NodeProps<PlanNodeData>) => {
  const vis = useContext(MetricsVisibilityContext)
  const heat = useContext(HeatmapContext)
  const headerLines = computeHeaderLines(data)
  const hints = buildHints(data)
  const isNeverExecuted = !!data.neverExecuted

  return (
    <div
      style={{ width: `${DEFAULT_NODE_WIDTH}px` }}
      className={cn(
        'border overflow-hidden rounded-[4px] shadow-sm bg-background transition-all',
        selected
          ? 'border-brand-500/70 ring ring-brand-500/60 ring-offset-[3px] ring-offset-background'
          : 'border-border',
        isNeverExecuted && 'border-dashed opacity-70'
      )}
    >
      <Handle type="target" position={Position.Top} className={HIDDEN_NODE_CONNECTOR} />
      <header
        style={{ height: `${DEFAULT_NODE_HEIGHT_CONSTANTS.HEADER_H}px` }}
        className="text-[0.55rem] pl-2 pr-1 bg-alternative flex items-center"
      >
        <div className="flex gap-x-1 items-center min-w-0">
          <Workflow strokeWidth={1} size={12} className="text-light flex-shrink-0" />
          <span className="truncate">{data.label}</span>
        </div>
        <div className="flex items-center gap-x-1 ml-auto flex-shrink-0">
          {hints}
          {isNeverExecuted && (
            <Tooltip>
              <TooltipTrigger className="flex">
                <Badge
                  variant="outline"
                  size="small"
                  className="p-0.5 rounded"
                  aria-label="Postgres skipped this step when running the query."
                >
                  <TimerOff size={10} strokeWidth={1} />
                </Badge>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="center"
                className="max-w-[220px] text-[11px] leading-4"
              >
                <p>Postgres skipped this step when running the query.</p>
                <p className="text-muted-foreground">Loops observed: 0</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </header>
      {heat.mode !== 'none' && <Heatmap data={data} />}
      {headerLines.length > 0 && (
        <div className="px-2 bg-alternative pb-3">
          {headerLines.map((line, i) => (
            <div key={i} className="text-[0.55rem] break-words h-[15px]">
              {line}
            </div>
          ))}
        </div>
      )}

      <ul>
        {metricsListData(data, vis).map((metric) => {
          if (!metric.condition) return null

          return (
            <NodeItem key={metric.id} tooltip={metric.tooltip}>
              {metric?.icon && <div className="min-w-fit">{metric.icon}</div>}
              {metric.element}
            </NodeItem>
          )
        })}
      </ul>
      <Handle type="source" position={Position.Bottom} className={HIDDEN_NODE_CONNECTOR} />
    </div>
  )
}
