import { ArrowRight, ArrowUp, Clock } from 'lucide-react'
import { cn } from 'ui'
import { CostIndicator } from './ExplainVisualizer.CostIndicator'
import { RowCountIndicator } from './ExplainVisualizer.RowCountIndicator'
import {
  getOperationColor,
  getOperationDescription,
  getOperationIcon,
} from './ExplainVisualizer.utils'

import type { ExplainNode } from './ExplainVisualizer.types'

export interface ExplainNodeRendererProps {
  node: ExplainNode
  isLast: boolean
  depth: number
  maxCost: number
  parentHasMore: boolean[]
  isRoot?: boolean
}

export function ExplainNodeRenderer({
  node,
  isLast,
  depth,
  maxCost,
  parentHasMore,
  isRoot = false,
}: ExplainNodeRendererProps) {
  const Icon = getOperationIcon(node.operation)
  const colorClass = getOperationColor(node.operation)
  const description = getOperationDescription(node.operation, node)
  const isLeaf = node.children.length === 0

  const detailLines = node.details ? node.details.split('\n').filter(Boolean) : []

  const targetName = detailLines.length > 0 && !detailLines[0].includes(':') ? detailLines[0] : null

  return (
    <div className="relative">
      {/* Node content */}
      <div
        className={cn(
          'flex items-start gap-3 py-3 px-3 rounded-lg border border-transparent hover:border-border hover:bg-surface-100 transition-all'
        )}
        style={{ marginLeft: `${depth * 32}px` }}
      >
        {/* Pipeline flow indicator */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center',
              isRoot
                ? 'bg-brand/20 text-brand'
                : isLeaf
                  ? 'bg-surface-300 text-foreground-light'
                  : 'bg-surface-200 text-foreground-muted'
            )}
          >
            {isRoot ? (
              <ArrowRight size={14} className={'text-brand'} />
            ) : (
              <ArrowUp size={14} className={'text-foreground-light'} />
            )}
          </div>
        </div>

        {/* Icon */}
        <div className={cn('flex-shrink-0 mt-0.5 rounded-lg px-1')}>
          <Icon size={18} strokeWidth={2} className={colorClass} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Operation name and target */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('font-semibold text-sm', colorClass)}>{node.operation}</span>
            {targetName && (
              <code className="text-xs text-foreground-light bg-surface-200 px-2 py-0.5 rounded-md font-medium">
                {targetName}
              </code>
            )}
          </div>

          {/* Description */}
          {description && <p className="text-xs text-foreground-lighter mt-1">{description}</p>}

          {/* Metrics row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Cost visualization bar */}
            {node.cost && <CostIndicator cost={node.cost.end} maxCost={maxCost} />}

            {node.actualTime && (
              <>
                <span className="text-foreground-muted text-xs">|</span>
                <div className="flex items-center gap-1 text-xs text-foreground-lighter">
                  <Clock size={12} />
                  <span className="font-mono font-medium">{node.actualTime.end.toFixed(2)}ms</span>
                </div>
              </>
            )}

            {/* Row count */}
            {(node.actualRows !== null || node.rows !== null) && (
              <>
                <span className="text-foreground-muted text-xs">|</span>
                <RowCountIndicator
                  actualRows={node.actualRows}
                  estimatedRows={node.rows}
                  rowsRemovedByFilter={node.rowsRemovedByFilter}
                />
              </>
            )}
          </div>

          {/* Detail lines (Filter, Hash Cond, etc.) */}
          {detailLines.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {detailLines.map((detail, idx) => {
                // Skip the first line if it was already shown as the target
                if (idx === 0 && !detail.includes(':')) return null
                // Skip "Rows Removed" as we show it in the flow visualization
                if (detail.includes('Rows Removed by Filter')) return null
                return (
                  <div key={idx} className="text-xs text-foreground font-mono py-1 rounded">
                    {detail}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Render children */}
      {node.children.length > 0 && (
        <div className="relative">
          {node.children.map((child, idx) => (
            <ExplainNodeRenderer
              key={idx}
              node={child}
              isLast={idx === node.children.length - 1}
              depth={depth + 1}
              maxCost={maxCost}
              parentHasMore={[...parentHasMore, !isLast]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
