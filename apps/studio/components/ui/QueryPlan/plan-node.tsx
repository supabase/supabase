import { useContext } from 'react'
import { Handle, Position } from 'reactflow'
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
} from './utils/node-display'
import { formatMs } from './utils/formats'

const metricsListData = (data: PlanNodeData, vis: MetricsVisibility) => {
  const loopsSuffix = data.actualLoops ? ` ×${data.actualLoops.toLocaleString()}` : ''
  const formattedTotalTime = formatMs(data.actualTotalTime)
  const formattedSelfTime = formatMs(data.exclusiveTimeMs)

  return [
    // Workers planned/launched
    {
      id: 'workers',
      condition: !(data.workersPlanned === undefined && data.workersLaunched === undefined),
      element: (
        <>
          <span>Workers</span>
          <ul className="flex flex-row items-center flex-1 justify-end gap-x-1">
            <li>Planned:{data.workersPlanned}</li>
            <li>Launched:{data.workersLaunched}</li>
          </ul>
        </>
      ),
    },
    // Time (actual)
    {
      id: 'time',
      condition: vis.time && data.actualTotalTime !== undefined,
      element: (
        <>
          <span>time</span>
          <span>
            {formattedTotalTime ?? data.actualTotalTime} ms
            {loopsSuffix}
          </span>
        </>
      ),
    },
    // Time (self/exclusive)
    {
      id: 'time-self',
      condition: vis.time && data.exclusiveTimeMs !== undefined,
      element: (
        <>
          <span>self time</span>
          <span>{formattedSelfTime ?? data.exclusiveTimeMs} ms</span>
        </>
      ),
    },
    // Rows (actual / est)
    {
      id: 'rows',
      condition: vis.rows && (data.actualRows !== undefined || data.planRows !== undefined),
      element: (
        <>
          <span>rows</span>
          <span>
            {data.actualRows !== undefined ? data.actualRows : '-'}
            {data.planRows !== undefined ? ` / est ${data.planRows}` : ''}
          </span>
        </>
      ),
    },
    // Estimation factor (actual_total / plan_est)
    {
      id: 'est-factor',
      title:
        data.estActualTotalRows !== undefined && data.planRows !== undefined
          ? `actual_total_rows: ${data.estActualTotalRows} / plan_rows: ${data.planRows}`
          : undefined,
      condition: vis.rows && data.estFactor !== undefined,
      element: (
        <>
          <span>estim</span>
          <span className="inline-flex items-center gap-[2px]">
            {data.estDirection === 'under' ? (
              <ArrowBigDown size={10} strokeWidth={1} fill="currentColor" />
            ) : data.estDirection === 'over' ? (
              <ArrowBigUp size={10} strokeWidth={1} fill="currentColor" />
            ) : null}
            {data.estFactor?.toFixed(2)}×
          </span>
        </>
      ),
    },
    // Costs (startup → total)
    {
      id: 'cost',
      condition: vis.cost && (data.startupCost !== undefined || data.totalCost !== undefined),
      element: (
        <>
          <span>cost</span>
          <span>
            {data.startupCost !== undefined ? data.startupCost : '-'}
            {data.totalCost !== undefined ? ` → ${data.totalCost}` : ''}
          </span>
        </>
      ),
    },
    // Cost (self/exclusive)
    {
      id: 'cost-self',
      condition: vis.cost && data.exclusiveCost !== undefined,
      element: (
        <>
          <span>self cost</span>
          <span>{data.exclusiveCost?.toFixed(2)}</span>
        </>
      ),
    },
    // Plan width
    {
      id: 'plan-width',
      condition: data.planWidth !== undefined,
      element: (
        <>
          <span>plan width</span>
          <span>{data.planWidth} bytes</span>
        </>
      ),
    },
    // Filters/Removals
    {
      id: 'removed-filter',
      condition: data.rowsRemovedByFilter !== undefined,
      element: (
        <>
          <span>removed (filter)</span>
          <span className="flex items-center">
            {data.rowsRemovedByFilter} ({removedPercentValue(data, data.rowsRemovedByFilter)}%)
          </span>
        </>
      ),
    },
    {
      id: 'removed-join-filter',
      condition: data.rowsRemovedByJoinFilter !== undefined,
      element: (
        <>
          <span>removed (join filter)</span>
          <span>
            {data.rowsRemovedByJoinFilter} (
            {removedPercentValue(data, data.rowsRemovedByJoinFilter)}%)
          </span>
        </>
      ),
    },
    {
      id: 'removed-index-recheck',
      condition: data.rowsRemovedByIndexRecheck !== undefined,
      element: (
        <>
          <span>removed (recheck)</span>
          <span>
            {data.rowsRemovedByIndexRecheck} (
            {removedPercentValue(data, data.rowsRemovedByIndexRecheck)}
            %)
          </span>
        </>
      ),
    },
    {
      id: 'heap-fetches',
      condition: data.heapFetches !== undefined,
      element: (
        <>
          <span>heap fetches</span>
          <span>{data.heapFetches}</span>
        </>
      ),
    },
    // Buffers
    {
      id: 'shared-buffers',
      title: sharedTooltip(data),
      condition: vis.buffers && hasShared(data),
      element: (
        <>
          <span>shared (self)</span>
          <span>
            h:{data.exSharedHit ?? 0} r:{data.exSharedRead ?? 0} d:{data.exSharedDirtied ?? 0} w:
            {data.exSharedWritten ?? 0}
          </span>
        </>
      ),
    },
    {
      id: 'temp-buffers',
      title: tempTooltip(data),
      condition: vis.buffers && hasTemp(data),
      element: (
        <>
          <span>temp (self)</span>
          <span>
            r:{data.exTempRead ?? 0} w:{data.exTempWritten ?? 0}
          </span>
        </>
      ),
    },
    {
      id: 'local-buffers',
      title: localTooltip(data),
      condition: vis.buffers && hasLocal(data),
      element: (
        <>
          <span>local (self)</span>
          <span>
            h:{data.exLocalHit ?? 0} r:{data.exLocalRead ?? 0} d:{data.exLocalDirtied ?? 0} w:
            {data.exLocalWritten ?? 0}
          </span>
        </>
      ),
    },
    // Output cols (verbose)
    {
      id: 'output-cols',
      condition: vis.output && Array.isArray(data.outputCols) && data.outputCols.length > 0,
      element: (
        <>
          <span>output</span>
          <span className="truncate max-w-[95px]" title={data.outputCols?.join(', ')}>
            {data.outputCols?.join(', ')}
          </span>
        </>
      ),
    },
    // I/O times
    {
      id: 'io-times',
      condition: vis.buffers && (data.ioReadTime !== undefined || data.ioWriteTime !== undefined),
      element: (
        <>
          {' '}
          <span>io</span>
          <span>
            {data.ioReadTime !== undefined ? `r:${data.ioReadTime}ms` : ''}
            {data.ioWriteTime !== undefined
              ? `${data.ioReadTime !== undefined ? ' ' : ''}w:${data.ioWriteTime}ms`
              : ''}
          </span>
        </>
      ),
    },
  ]
}

export const PlanNode = ({ data }: { data: PlanNodeData }) => {
  const vis = useContext(MetricsVisibilityContext)
  const heat = useContext(HeatmapContext)
  const headerLines = computeHeaderLines(data)

  return (
    <div
      className="border-[0.5px] overflow-hidden rounded-[4px] shadow-sm"
      style={{ width: DEFAULT_NODE_WIDTH }}
    >
      <Handle type="target" position={Position.Top} className={HIDDEN_NODE_CONNECTOR} />
      <header
        className={cn(
          'text-[0.55rem] pl-2 pr-1 bg-alternative flex items-center justify-between',
          DEFAULT_NODE_HEIGHT_CONSTANTS.ITEM_H
        )}
      >
        <div className="flex gap-x-1 items-center">
          <Workflow strokeWidth={1} size={12} className="text-light" />
          {data.label}
        </div>
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
            <NodeItem key={metric.id} title={metric.title}>
              {metric.element}
            </NodeItem>
          )
        })}
      </ul>
      <Handle type="source" position={Position.Bottom} className={HIDDEN_NODE_CONNECTOR} />
    </div>
  )
}
