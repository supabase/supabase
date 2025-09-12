import { useContext } from 'react'
import { Handle, Position } from 'reactflow'
import { Workflow, ArrowBigUp, ArrowBigDown } from 'lucide-react'

import type { PlanNodeData } from './types'
import { Badge, cn } from 'ui'
import { NodeItem } from './node-item'
import { HeatmapContext, MetricsVisibilityContext } from './contexts'
import { DEFAULT_NODE_WIDTH, HIDDEN_NODE_CONNECTOR } from './constants'
import { blocksToBytes } from './utils/formats'
import { computeHeaderLines, hasShared, hasTemp, hasLocal } from './utils/node-display'

export const PlanNode = ({ data }: { data: PlanNodeData }) => {
  const itemHeight = 'h-[22px]'
  const vis = useContext(MetricsVisibilityContext)
  const heat = useContext(HeatmapContext)

  const headerLines = computeHeaderLines(data)

  const sharedTooltip = () => {
    const incl = `incl: h=${data.sharedHit ?? 0} (${blocksToBytes(data.sharedHit)}), r=${
      data.sharedRead ?? 0
    } (${blocksToBytes(data.sharedRead)}), d=${data.sharedDirtied ?? 0} (${blocksToBytes(
      data.sharedDirtied
    )}), w=${data.sharedWritten ?? 0} (${blocksToBytes(data.sharedWritten)})`
    const self = `self: h=${data.exSharedHit ?? 0} (${blocksToBytes(
      data.exSharedHit
    )}), r=${data.exSharedRead ?? 0} (${blocksToBytes(data.exSharedRead)}), d=${
      data.exSharedDirtied ?? 0
    } (${blocksToBytes(data.exSharedDirtied)}), w=${data.exSharedWritten ?? 0} (${blocksToBytes(
      data.exSharedWritten
    )})`
    return `Shared Blocks\n${incl}\n${self}`
  }

  const localTooltip = () => {
    const incl = `incl: h=${data.localHit ?? 0} (${blocksToBytes(data.localHit)}), r=${
      data.localRead ?? 0
    } (${blocksToBytes(data.localRead)}), d=${data.localDirtied ?? 0} (${blocksToBytes(
      data.localDirtied
    )}), w=${data.localWritten ?? 0} (${blocksToBytes(data.localWritten)})`
    const self = `self: h=${data.exLocalHit ?? 0} (${blocksToBytes(
      data.exLocalHit
    )}), r=${data.exLocalRead ?? 0} (${blocksToBytes(data.exLocalRead)}), d=${
      data.exLocalDirtied ?? 0
    } (${blocksToBytes(data.exLocalDirtied)}), w=${data.exLocalWritten ?? 0} (${blocksToBytes(
      data.exLocalWritten
    )})`
    return `Local Blocks\n${incl}\n${self}`
  }

  const tempTooltip = () => {
    const incl = `incl: r=${data.tempRead ?? 0} (${blocksToBytes(
      data.tempRead
    )}), w=${data.tempWritten ?? 0} (${blocksToBytes(data.tempWritten)})`
    const self = `self: r=${data.exTempRead ?? 0} (${blocksToBytes(
      data.exTempRead
    )}), w=${data.exTempWritten ?? 0} (${blocksToBytes(data.exTempWritten)})`
    return `Temp Blocks\n${incl}\n${self}`
  }

  // Calculate removed percentage (0-100) based on removed and actual rows×loops
  const removedPercentValue = (removed?: number): number | undefined => {
    const r = removed ?? 0
    const actualTotal = (data.actualRows ?? 0) * (data.actualLoops ?? 1)
    const denom = r + actualTotal
    if (denom <= 0 || r <= 0) return undefined
    return Math.round((r / denom) * 100)
  }

  // Heatmap progress bar (time/rows/cost)
  const valueForHeat = (() => {
    switch (heat.mode) {
      case 'time':
        return (data.exclusiveTimeMs ?? 0) || (data.actualTotalTime ?? 0) * (data.actualLoops ?? 1)
      case 'rows': {
        const actualTotal = (data.actualRows ?? 0) * (data.actualLoops ?? 1)
        return actualTotal || (data.planRows ?? 0)
      }
      case 'cost':
        return data.exclusiveCost ?? 0
      default:
        return 0
    }
  })()

  const maxForHeat =
    heat.mode === 'time'
      ? heat.maxTime
      : heat.mode === 'rows'
        ? heat.maxRows
        : heat.mode === 'cost'
          ? heat.maxCost
          : 1
  const pct = Math.max(0, Math.min(100, Math.round((valueForHeat / (maxForHeat || 1)) * 100)))
  const heatColor = (() => {
    if (heat.mode === 'none') return 'transparent'
    const hue = 120 - pct * 1.2 // 120->0 (green->red)
    return `hsl(${hue}, 85%, 45%)`
  })()

  return (
    <div
      className="border-[0.5px] overflow-hidden rounded-[4px] shadow-sm"
      style={{ width: DEFAULT_NODE_WIDTH }}
    >
      <Handle type="target" position={Position.Top} className={HIDDEN_NODE_CONNECTOR} />
      <header
        className={cn(
          'text-[0.55rem] pl-2 pr-1 bg-alternative flex items-center justify-between',
          itemHeight
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
      {heat.mode !== 'none' && (
        <div className="h-[3px] w-full bg-surface-100">
          <div
            className="h-full transition-all"
            style={{ width: `${pct}%`, backgroundColor: heatColor }}
            title={
              heat.mode === 'time'
                ? `time (self): ${valueForHeat.toFixed(2)} ms`
                : heat.mode === 'rows'
                  ? `rows: ${valueForHeat}`
                  : heat.mode === 'cost'
                    ? `self cost: ${valueForHeat.toFixed(2)}`
                    : undefined
            }
          />
        </div>
      )}
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
        {/* Workers planned/launched */}
        {(data.workersPlanned || data.workersLaunched) && (
          <NodeItem title="Parallel workers summary">
            <span>Workers</span>
            <ul className="flex flex-row items-center flex-1 justify-end gap-x-1">
              <li>Planned:{data.workersPlanned}</li>
              <li>Launched:{data.workersLaunched}</li>
            </ul>
          </NodeItem>
        )}
        {/* Time (actual) */}
        {vis.time && data.actualTotalTime !== undefined && (
          <NodeItem>
            <span>time</span>
            <span>
              {data.actualTotalTime} ms{data.actualLoops ? ` ×${data.actualLoops}` : ''}
            </span>
          </NodeItem>
        )}
        {/* Time (self/exclusive) */}
        {vis.time && typeof data.exclusiveTimeMs === 'number' && (
          <NodeItem>
            <span>self time</span>
            <span>{data.exclusiveTimeMs} ms</span>
          </NodeItem>
        )}

        {/* Rows (actual / est) */}
        {vis.rows && (data.actualRows !== undefined || data.planRows !== undefined) && (
          <NodeItem>
            <span>rows</span>
            <span>
              {data.actualRows !== undefined ? data.actualRows : '-'}
              {data.planRows !== undefined ? ` / est ${data.planRows}` : ''}
            </span>
          </NodeItem>
        )}
        {/* Estimation factor (actual_total / plan_est) */}
        {vis.rows && typeof data.estFactor === 'number' && (
          <NodeItem
            title={
              typeof data.estActualTotalRows === 'number' && typeof data.planRows === 'number'
                ? `actual_total_rows: ${data.estActualTotalRows} / plan_rows: ${data.planRows}`
                : undefined
            }
          >
            <span>estim</span>
            <span className="inline-flex items-center gap-[2px]">
              {data.estDirection === 'under' ? (
                <ArrowBigDown size={10} strokeWidth={1} fill="currentColor" />
              ) : data.estDirection === 'over' ? (
                <ArrowBigUp size={10} strokeWidth={1} fill="currentColor" />
              ) : null}
              {data.estFactor.toFixed(2)}×
            </span>
          </NodeItem>
        )}

        {/* Costs (startup → total) */}
        {vis.cost && (data.startupCost !== undefined || data.totalCost !== undefined) && (
          <NodeItem>
            <span>cost</span>
            <span>
              {data.startupCost !== undefined ? data.startupCost : '-'}
              {data.totalCost !== undefined ? ` → ${data.totalCost}` : ''}
            </span>
          </NodeItem>
        )}
        {/* Cost (self/exclusive) */}
        {vis.cost && typeof data.exclusiveCost === 'number' && (
          <NodeItem>
            <span>self cost</span>
            <span>{data.exclusiveCost.toFixed(2)}</span>
          </NodeItem>
        )}

        {/* Width */}
        {data.planWidth !== undefined && (
          <NodeItem>
            <span>plan width</span>
            <span>{data.planWidth} bytes</span>
          </NodeItem>
        )}

        {/* Filters/Removals */}
        {data.rowsRemovedByFilter !== undefined && (
          <NodeItem>
            <span>removed (filter)</span>
            <span className="flex items-center">
              {data.rowsRemovedByFilter} ({removedPercentValue(data.rowsRemovedByFilter)}%)
            </span>
          </NodeItem>
        )}
        {data.rowsRemovedByJoinFilter !== undefined && (
          <NodeItem>
            <span>removed (join filter)</span>
            <span>
              {data.rowsRemovedByJoinFilter} ({removedPercentValue(data.rowsRemovedByJoinFilter)}%)
            </span>
          </NodeItem>
        )}
        {data.rowsRemovedByIndexRecheck !== undefined && (
          <NodeItem>
            <span>removed (recheck)</span>
            <span>
              {data.rowsRemovedByIndexRecheck} (
              {removedPercentValue(data.rowsRemovedByIndexRecheck)}
              %)
            </span>
          </NodeItem>
        )}
        {data.heapFetches !== undefined && (
          <NodeItem>
            <span>heap fetches</span>
            <span>{data.heapFetches}</span>
          </NodeItem>
        )}

        {/* BUFFERS */}
        {vis.buffers && hasShared(data) && (
          <NodeItem title={sharedTooltip()}>
            <span>shared (self)</span>
            <span>
              h:{data.exSharedHit ?? 0} r:{data.exSharedRead ?? 0} d:{data.exSharedDirtied ?? 0} w:
              {data.exSharedWritten ?? 0}
            </span>
          </NodeItem>
        )}
        {vis.buffers && hasTemp(data) && (
          <NodeItem title={tempTooltip()}>
            <span>temp (self)</span>
            <span>
              r:{data.exTempRead ?? 0} w:{data.exTempWritten ?? 0}
            </span>
          </NodeItem>
        )}
        {vis.buffers && hasLocal(data) && (
          <NodeItem title={localTooltip()}>
            <span>local (self)</span>
            <span>
              h:{data.exLocalHit ?? 0} r:{data.exLocalRead ?? 0} d:{data.exLocalDirtied ?? 0} w:
              {data.exLocalWritten ?? 0}
            </span>
          </NodeItem>
        )}

        {/* Output cols (verbose) */}
        {vis.output && Array.isArray(data.outputCols) && data.outputCols.length > 0 && (
          <NodeItem heightClass="min-h-[22px]">
            <span>output</span>
            <span className="truncate max-w-[95px]" title={data.outputCols.join(', ')}>
              {data.outputCols.join(', ')}
            </span>
          </NodeItem>
        )}

        {/* I/O times */}
        {vis.buffers && (data.ioReadTime !== undefined || data.ioWriteTime !== undefined) && (
          <NodeItem>
            <span>io</span>
            <span>
              {typeof data.ioReadTime === 'number' ? `r:${data.ioReadTime}ms` : ''}
              {typeof data.ioWriteTime === 'number'
                ? `${typeof data.ioReadTime === 'number' ? ' ' : ''}w:${data.ioWriteTime}ms`
                : ''}
            </span>
          </NodeItem>
        )}
      </ul>
      <Handle type="source" position={Position.Bottom} className={HIDDEN_NODE_CONNECTOR} />
    </div>
  )
}
