import { type ReactNode, useContext } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import { Workflow, ArrowBigUp, ArrowBigDown } from 'lucide-react'

import type { PlanNodeData } from './types'
import { Badge, cn } from 'ui'
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
  tooltip?: ReactNode
}

const metricsListData = (data: PlanNodeData, vis: MetricsVisibility): MetricRow[] => {
  const formattedLoops =
    data.actualLoops !== undefined
      ? formatNumber(data.actualLoops) ?? `${data.actualLoops}`
      : undefined
  const loopsSuffix =
    formattedLoops !== undefined
      ? ` · ran ${formattedLoops} time${data.actualLoops === 1 ? '' : 's'}`
      : ''
  const formattedTotalTime = formatMs(data.actualTotalTime)
  const formattedSelfTime = formatMs(data.exclusiveTimeMs)

  const actualRows = data.actualRows !== undefined ? formatOrDash(data.actualRows) : data.actualRows
  const estimatedRows = data.planRows !== undefined ? formatOrDash(data.planRows) : data.planRows

  const estimationTooltip =
    data.estActualTotalRows !== undefined && data.planRows !== undefined
      ? `Estimate accuracy
Actual rows across runs: ${formatOrDash(data.estActualTotalRows)}
Planner expected rows: ${formatOrDash(data.planRows)}
Values above 1.00 mean more rows than expected; below 1.00 mean fewer.`
      : 'Estimate accuracy compares actual rows to the planner estimate. Values above 1.00 mean more rows than expected; below 1.00 mean fewer.'

  const estimationIcon =
    data.estDirection === 'under' ? (
      <ArrowBigDown size={10} strokeWidth={1} fill="currentColor" />
    ) : data.estDirection === 'over' ? (
      <ArrowBigUp size={10} strokeWidth={1} fill="currentColor" />
    ) : null

  const filterPercent = removedPercentValue(data, data.rowsRemovedByFilter)
  const joinFilterPercent = removedPercentValue(data, data.rowsRemovedByJoinFilter)
  const recheckPercent = removedPercentValue(data, data.rowsRemovedByIndexRecheck)

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
      condition: vis.time && data.actualTotalTime !== undefined,
      tooltip: 'Time spent on this step including any child steps.',
      element: (
        <>
          <span>Total time</span>
          <span>
            {formattedTotalTime ?? data.actualTotalTime} ms
            {loopsSuffix}
          </span>
        </>
      ),
    },
    {
      id: 'time-self',
      condition: vis.time && data.exclusiveTimeMs !== undefined,
      tooltip: 'Time spent only inside this node. Child steps are not included.',
      element: (
        <>
          <span>Step time</span>
          <span>{formattedSelfTime ?? data.exclusiveTimeMs} ms</span>
        </>
      ),
    },
    {
      id: 'rows',
      condition: vis.rows && (data.actualRows !== undefined || data.planRows !== undefined),
      tooltip: 'Rows processed versus what the planner expected.',
      element: (
        <>
          <span>Rows seen</span>
          <span>
            {actualRows !== undefined ? actualRows : '-'}
            {estimatedRows !== undefined ? ` · expected ${estimatedRows}` : ''}
          </span>
        </>
      ),
    },
    {
      id: 'est-factor',
      condition: vis.rows && data.estFactor !== undefined,
      tooltip: estimationTooltip,
      element: (
        <>
          <span>Estimate accuracy</span>
          <span className="inline-flex items-center gap-[4px]">
            {estimationIcon}
            {data.estFactor?.toFixed(2)}×
          </span>
        </>
      ),
    },
    {
      id: 'cost',
      condition: vis.cost && (data.startupCost !== undefined || data.totalCost !== undefined),
      tooltip: 'Planner cost units (not milliseconds). Shows startup cost → total cost.',
      element: (
        <>
          <span>Planner cost</span>
          <span>
            {data.startupCost !== undefined ? formatOrDash(data.startupCost) : '-'}
            {data.totalCost !== undefined ? ` → ${formatOrDash(data.totalCost)}` : ''}
          </span>
        </>
      ),
    },
    {
      id: 'cost-self',
      condition: vis.cost && data.exclusiveCost !== undefined,
      tooltip: 'Portion of the planner cost assigned only to this step.',
      element: (
        <>
          <span>Cost for this step</span>
          <span>{data.exclusiveCost?.toFixed(2)}</span>
        </>
      ),
    },
    {
      id: 'plan-width',
      condition: data.planWidth !== undefined,
      tooltip: 'Average bytes per row output by this step.',
      element: (
        <>
          <span>Row size</span>
          <span>{formatOrDash(data.planWidth)} bytes</span>
        </>
      ),
    },
    {
      id: 'removed-filter',
      condition: data.rowsRemovedByFilter !== undefined,
      tooltip: 'Rows skipped because a WHERE or filter condition returned false.',
      element: (
        <>
          <span>Filtered out rows</span>
          <span>
            {formatOrDash(data.rowsRemovedByFilter)}
            {filterPercent !== undefined ? ` (${filterPercent}%)` : ''}
          </span>
        </>
      ),
    },
    {
      id: 'removed-join-filter',
      condition: data.rowsRemovedByJoinFilter !== undefined,
      tooltip: 'Rows dropped because the join filter did not match.',
      element: (
        <>
          <span>Join filter drops</span>
          <span>
            {formatOrDash(data.rowsRemovedByJoinFilter)}
            {joinFilterPercent !== undefined ? ` (${joinFilterPercent}%)` : ''}
          </span>
        </>
      ),
    },
    {
      id: 'removed-index-recheck',
      condition: data.rowsRemovedByIndexRecheck !== undefined,
      tooltip: 'Rows removed after an index recheck (commonly due to visibility rules).',
      element: (
        <>
          <span>Index recheck drops</span>
          <span>
            {formatOrDash(data.rowsRemovedByIndexRecheck)}
            {recheckPercent !== undefined ? ` (${recheckPercent}%)` : ''}
          </span>
        </>
      ),
    },
    {
      id: 'heap-fetches',
      condition: data.heapFetches !== undefined,
      tooltip: 'Rows fetched directly from the table because they were not already in cache.',
      element: (
        <>
          <span>Table fetches</span>
          <span>{formatOrDash(data.heapFetches)}</span>
        </>
      ),
    },
    {
      id: 'shared-buffers',
      condition: vis.buffers && hasShared(data),
      tooltip: (
        <div className="space-y-1">
          <p>Shared cache blocks touched (all runs vs. just this node).</p>
          <span className="block font-mono whitespace-pre-wrap">{sharedTooltip(data)}</span>
        </div>
      ),
      element: (
        <>
          <span>Shared cache (self)</span>
          <span>
            h:{data.exSharedHit ?? 0} r:{data.exSharedRead ?? 0} d:{data.exSharedDirtied ?? 0} w:
            {data.exSharedWritten ?? 0}
          </span>
        </>
      ),
    },
    {
      id: 'temp-buffers',
      condition: vis.buffers && hasTemp(data),
      tooltip: (
        <div className="space-y-1">
          <p>Temporary blocks written to disk for this step.</p>
          <span className="block font-mono whitespace-pre-wrap">{tempTooltip(data)}</span>
        </div>
      ),
      element: (
        <>
          <span>Temporary blocks (self)</span>
          <span>
            r:{data.exTempRead ?? 0} w:{data.exTempWritten ?? 0}
          </span>
        </>
      ),
    },
    {
      id: 'local-buffers',
      condition: vis.buffers && hasLocal(data),
      tooltip: (
        <div className="space-y-1">
          <p>Local cache blocks touched (per worker memory).</p>
          <span className="block font-mono whitespace-pre-wrap">{localTooltip(data)}</span>
        </div>
      ),
      element: (
        <>
          <span>Local cache (self)</span>
          <span>
            h:{data.exLocalHit ?? 0} r:{data.exLocalRead ?? 0} d:{data.exLocalDirtied ?? 0} w:
            {data.exLocalWritten ?? 0}
          </span>
        </>
      ),
    },
    {
      id: 'output-cols',
      condition: vis.output && Array.isArray(data.outputCols) && data.outputCols.length > 0,
      tooltip: (
        <div className="space-y-1">
          <p>Columns passed to the next step.</p>
          <span className="block whitespace-pre-wrap">{data.outputCols?.join(', ')}</span>
        </div>
      ),
      element: (
        <>
          <span>Columns returned</span>
          <span className="truncate max-w-[95px]">{data.outputCols?.join(', ')}</span>
        </>
      ),
    },
    {
      id: 'io-times',
      condition: vis.buffers && (data.ioReadTime !== undefined || data.ioWriteTime !== undefined),
      tooltip: 'Time spent performing disk reads and writes for this step.',
      element: (
        <>
          <span>Disk I/O time</span>
          <span>
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

  return (
    <div
      className={cn(
        'border-[0.5px] overflow-hidden rounded-[4px] shadow-sm bg-background transition-all',
        selected
          ? 'border-brand ring-2 ring-brand ring-offset-2 ring-offset-background shadow-lg'
          : 'border-border/60'
      )}
      style={{ width: DEFAULT_NODE_WIDTH }}
    >
      <Handle type="target" position={Position.Top} className={HIDDEN_NODE_CONNECTOR} />
      <header
        style={{ height: `${DEFAULT_NODE_HEIGHT_CONSTANTS.HEADER_H}px` }}
        className="text-[0.55rem] pl-2 pr-1 bg-alternative flex items-center"
      >
        <div className="flex gap-x-1 items-center">
          <Workflow strokeWidth={1} size={12} className="text-light" />
          {data.label}
        </div>
        <div className="flex items-center gap-x-1 ml-auto">
          {hints}
          {data.neverExecuted && (
            <Badge
              variant="destructive"
              size="small"
              title="Never executed (loops=0)"
              className="h-[15px] px-1 py-[1px] text-[0.55rem]"
            >
              Never executed
            </Badge>
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
              {metric.element}
            </NodeItem>
          )
        })}
      </ul>
      <Handle type="source" position={Position.Bottom} className={HIDDEN_NODE_CONNECTOR} />
    </div>
  )
}
