import { type ReactNode, useContext } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { Workflow, TimerOff } from 'lucide-react'

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
import { getMetricDefinition } from './utils/metrics'

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
  const parallelHelpersDef = getMetricDefinition('parallel-helpers')
  const totalTimeDef = getMetricDefinition('total-time')
  const selfTimeDef = getMetricDefinition('self-time')
  const rowsSeenDef = getMetricDefinition('rows-seen')
  const rowsFilteredDef = getMetricDefinition('rows-filtered')
  const rowsJoinFilterDef = getMetricDefinition('rows-join-filter')
  const rowsIndexRecheckDef = getMetricDefinition('rows-index-recheck')
  const rowSizeDef = getMetricDefinition('row-size')
  const totalCostDef = getMetricDefinition('total-cost')
  const selfCostDef = getMetricDefinition('self-cost')
  const tableFetchesDef = getMetricDefinition('table-fetches')
  const sharedBuffersDef = getMetricDefinition('buffers-shared')
  const tempBuffersDef = getMetricDefinition('buffers-temp')
  const localBuffersDef = getMetricDefinition('buffers-local')
  const columnsReturnedDef = getMetricDefinition('columns-returned')
  const ioTimeDef = getMetricDefinition('io-time')

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
      id: parallelHelpersDef.id,
      condition: !(data.workersPlanned === undefined && data.workersLaunched === undefined),
      tooltip: parallelHelpersDef.description,
      element: (
        <>
          <span>{parallelHelpersDef.label}</span>
          <span className="flex flex-row items-center flex-1 justify-end gap-x-2">
            <span>Planned: {formatOrDash(data.workersPlanned)}</span>
            <span>Started: {formatOrDash(data.workersLaunched)}</span>
          </span>
        </>
      ),
    },
    {
      id: totalTimeDef.id,
      condition: metricsVisibility.time && data.actualTotalTime !== undefined,
      tooltip: totalTimeDef.description,
      icon: totalTimeDef.icon,
      element: (
        <>
          <span>{totalTimeDef.label}</span>
          <span className="flex items-center gap-x-1 ml-auto">
            <span>{formattedTotalTime ?? data.actualTotalTime} ms</span>
            <span className="text-foreground-light">({loopsSuffix})</span>
          </span>
        </>
      ),
    },
    {
      id: selfTimeDef.id,
      condition: metricsVisibility.time && data.exclusiveTimeMs !== undefined,
      tooltip: selfTimeDef.description,
      icon: selfTimeDef.icon,
      element: (
        <>
          <span>{selfTimeDef.label}</span>
          <span className={cn('ml-auto', slowHighlightClass)}>
            {formattedSelfTime ?? data.exclusiveTimeMs} ms
          </span>
        </>
      ),
    },
    {
      id: rowsSeenDef.id,
      condition:
        metricsVisibility.rows && (data.actualRows !== undefined || data.planRows !== undefined),
      tooltip: rowsSeenDef.description,
      icon: rowsSeenDef.icon,
      element: (
        <>
          <span>{rowsSeenDef.label}</span>
          <span className="flex items-center gap-x-1 ml-auto">
            <span>{actualRows !== undefined ? actualRows : '-'}</span>
            {estimatedRows !== undefined && (
              <span className="text-foreground-light">(expected {estimatedRows})</span>
            )}
          </span>
        </>
      ),
    },
    {
      id: rowsFilteredDef.id,
      condition: metricsVisibility.rows && data.rowsRemovedByFilter !== undefined,
      tooltip: rowsFilteredDef.description,
      icon: rowsFilteredDef.icon,
      element: (
        <>
          <span>{rowsFilteredDef.label}</span>
          <span className="flex items-center gap-x-1 ml-auto">
            <span>{formatOrDash(data.rowsRemovedByFilter)}</span>
            {filterPercent !== undefined && (
              <span className="text-foreground-light">({filterPercent}%)</span>
            )}
          </span>
        </>
      ),
    },
    {
      id: rowsJoinFilterDef.id,
      condition: metricsVisibility.rows && data.rowsRemovedByJoinFilter !== undefined,
      tooltip: rowsJoinFilterDef.description,
      icon: rowsJoinFilterDef.icon,
      element: (
        <>
          <span>{rowsJoinFilterDef.label}</span>
          <span className="flex items-center gap-x-1 ml-auto">
            <span>{formatOrDash(data.rowsRemovedByJoinFilter)}</span>
            {joinFilterPercent !== undefined && (
              <span className="text-foreground-light">({joinFilterPercent}%)</span>
            )}
          </span>
        </>
      ),
    },
    {
      id: rowsIndexRecheckDef.id,
      condition: metricsVisibility.rows && data.rowsRemovedByIndexRecheck !== undefined,
      tooltip: rowsIndexRecheckDef.description,
      icon: rowsIndexRecheckDef.icon,
      element: (
        <>
          <span>{rowsIndexRecheckDef.label}</span>
          <span className="flex items-center gap-x-1 ml-auto">
            <span>{formatOrDash(data.rowsRemovedByIndexRecheck)}</span>
            {recheckPercent !== undefined && (
              <span className="text-foreground-light">({recheckPercent}%)</span>
            )}
          </span>
        </>
      ),
    },
    {
      id: rowSizeDef.id,
      condition: metricsVisibility.rows && data.planWidth !== undefined,
      tooltip: rowSizeDef.description,
      icon: rowSizeDef.icon,
      element: (
        <>
          <span>{rowSizeDef.label}</span>
          <span className="ml-auto">{formatOrDash(data.planWidth)} bytes</span>
        </>
      ),
    },
    {
      id: totalCostDef.id,
      condition: metricsVisibility.cost && data.totalCost !== undefined,
      tooltip: totalCostDef.description,
      icon: totalCostDef.icon,
      element: (
        <>
          <span>{totalCostDef.label}</span>
          <span className="ml-auto">{formatOrDash(data.totalCost)}</span>
        </>
      ),
    },
    {
      id: selfCostDef.id,
      condition: metricsVisibility.cost && data.exclusiveCost !== undefined,
      tooltip: selfCostDef.description,
      icon: selfCostDef.icon,
      element: (
        <>
          <span>{selfCostDef.label}</span>
          <span className={cn('ml-auto', costHighlightClass)}>
            {data.exclusiveCost?.toFixed(2)}
          </span>
        </>
      ),
    },
    {
      id: tableFetchesDef.id,
      condition: metricsVisibility.buffers && data.heapFetches !== undefined,
      tooltip: tableFetchesDef.description,
      icon: tableFetchesDef.icon,
      element: (
        <>
          <span>{tableFetchesDef.label}</span>
          <span className="ml-auto">{formatOrDash(data.heapFetches)}</span>
        </>
      ),
    },
    {
      id: sharedBuffersDef.id,
      condition: metricsVisibility.buffers && hasShared(data),
      tooltip: (
        <div className="space-y-1">
          <p>{sharedBuffersDef.description}</p>
          <span className="block font-mono whitespace-pre-wrap">{sharedTooltip(data)}</span>
        </div>
      ),
      icon: sharedBuffersDef.icon,
      element: (
        <>
          <span>{sharedBuffersDef.label}</span>
          <span className="ml-auto">
            h:{data.exSharedHit ?? 0} r:{data.exSharedRead ?? 0} d:{data.exSharedDirtied ?? 0} w:
            {data.exSharedWritten ?? 0}
          </span>
        </>
      ),
    },
    {
      id: tempBuffersDef.id,
      condition: metricsVisibility.buffers && hasTemp(data),
      tooltip: (
        <div className="space-y-1">
          <p>{tempBuffersDef.description}</p>
          <span className="block font-mono whitespace-pre-wrap">{tempTooltip(data)}</span>
        </div>
      ),
      icon: tempBuffersDef.icon,
      element: (
        <>
          <span>{tempBuffersDef.label}</span>
          <span className="ml-auto">
            r:{data.exTempRead ?? 0} w:{data.exTempWritten ?? 0}
          </span>
        </>
      ),
    },
    {
      id: localBuffersDef.id,
      condition: metricsVisibility.buffers && hasLocal(data),
      tooltip: (
        <div className="space-y-1">
          <p>{localBuffersDef.description}</p>
          <span className="block font-mono whitespace-pre-wrap">{localTooltip(data)}</span>
        </div>
      ),
      icon: localBuffersDef.icon,
      element: (
        <>
          <span>{localBuffersDef.label}</span>
          <span className="ml-auto">
            h:{data.exLocalHit ?? 0} r:{data.exLocalRead ?? 0} d:{data.exLocalDirtied ?? 0} w:
            {data.exLocalWritten ?? 0}
          </span>
        </>
      ),
    },
    {
      id: columnsReturnedDef.id,
      condition:
        metricsVisibility.output && Array.isArray(data.outputCols) && data.outputCols.length > 0,
      icon: columnsReturnedDef.icon,
      tooltip: (
        <div className="space-y-1">
          <p>{columnsReturnedDef.description}</p>
          <span className="block whitespace-pre-wrap">{data.outputCols?.join(', ')}</span>
        </div>
      ),
      element: (
        <>
          <span>{columnsReturnedDef.label}</span>
          <span className="truncate max-w-[95px] ml-auto">{data.outputCols?.join(', ')}</span>
        </>
      ),
    },
    {
      id: ioTimeDef.id,
      condition:
        metricsVisibility.output &&
        (data.ioReadTime !== undefined || data.ioWriteTime !== undefined),
      tooltip: ioTimeDef.description,
      icon: ioTimeDef.icon,
      element: (
        <>
          <span>{ioTimeDef.label}</span>
          <span className="ml-auto">
            {data.ioReadTime !== undefined && `read ${data.ioReadTime}ms`}
            {data.ioWriteTime !== undefined
              ? `${data.ioReadTime !== undefined ? ' · ' : ''}write ${data.ioWriteTime}ms`
              : ''}
          </span>
        </>
      ),
    },
  ]
}

export const PlanNode = ({ data, selected, dragging }: NodeProps<PlanNodeData>) => {
  const vis = useContext(MetricsVisibilityContext)
  const heat = useContext(HeatmapContext)
  const headerLines = computeHeaderLines(data)
  const hints = buildHints(data)
  const isNeverExecuted = !!data.neverExecuted
  const isHighlighted = selected || dragging

  return (
    <div
      style={{ width: `${DEFAULT_NODE_WIDTH}px` }}
      className={cn(
        'border overflow-hidden rounded-[4px] shadow-sm bg-background transition-all',
        isHighlighted
          ? 'border-foreground-muted/70 ring ring-foreground-muted/40 ring-offset-[3px] ring-offset-background'
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
