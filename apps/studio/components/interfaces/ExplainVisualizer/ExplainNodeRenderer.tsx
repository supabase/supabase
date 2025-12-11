import { ArrowRight, ArrowUp, Clock } from 'lucide-react'
import { cn } from 'ui'
import { getOperationColor, getOperationDescription, getOperationIcon } from './utils'

import type { ExplainNode } from './types'

export interface ExplainNodeRendererProps {
  node: ExplainNode
  isLast: boolean
  depth: number
  maxCost: number
  parentHasMore: boolean[]
  isRoot?: boolean
}

// Render a single node in the tree
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
  const costValue = node.cost?.end || node.actualTime?.end || 0
  const costWidth = maxCost > 0 ? (costValue / maxCost) * 100 : 0
  const description = getOperationDescription(node.operation, node)
  const isLeaf = node.children.length === 0

  // Split details by newline to show each on its own line
  const detailLines = node.details ? node.details.split('\n').filter(Boolean) : []

  // Extract the target table/index name from details
  const targetName = detailLines.length > 0 && !detailLines[0].includes(':') ? detailLines[0] : null

  // Calculate rows filtered out
  const rowsFiltered = node.rowsRemovedByFilter
  const totalRowsScanned =
    rowsFiltered && node.actualRows !== null ? node.actualRows + rowsFiltered : null

  return (
    <div className="relative">
      {/* Vertical connection lines from ancestors */}
      {parentHasMore.map(
        (hasMore, i) =>
          hasMore && (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-border"
              style={{ left: `${i * 32 + 16}px` }}
            />
          )
      )}

      {/* Horizontal connector for this node */}
      {depth > 0 && (
        <div
          className="absolute top-5 h-px bg-border"
          style={{
            left: `${(depth - 1) * 32 + 16}px`,
            width: '16px',
          }}
        />
      )}

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
              <span className="text-xs font-medium">→</span>
            ) : (
              <ArrowUp size={14} className={isLeaf ? 'text-foreground-light' : ''} />
            )}
          </div>
        </div>

        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 mt-0.5 rounded-lg p-2',
            colorClass === 'text-warning' && 'bg-warning/10',
            colorClass === 'text-brand' && 'bg-brand/10',
            colorClass === 'text-purple-500' && 'bg-purple-500/10',
            colorClass === 'text-blue-500' && 'bg-blue-500/10',
            colorClass === 'text-foreground' && 'bg-surface-200'
          )}
        >
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
          {description && <p className="text-xs text-foreground-lighter mt-0.5">{description}</p>}

          {/* Metrics row */}
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            {/* Cost visualization bar */}
            {node.cost && (
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-surface-300 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      node.cost.end < 100 && 'bg-brand',
                      node.cost.end >= 100 && node.cost.end < 1000 && 'bg-warning',
                      node.cost.end >= 1000 && 'bg-destructive'
                    )}
                    style={{ width: `${Math.min(costWidth, 100)}%` }}
                  />
                </div>
                <span className="text-xs text-foreground-lighter">
                  cost <span className="font-mono font-medium">{node.cost.end.toFixed(1)}</span>
                </span>
              </div>
            )}

            {node.actualTime && (
              <div className="flex items-center gap-1 text-xs text-foreground-lighter">
                <Clock size={12} />
                <span className="font-mono font-medium">{node.actualTime.end.toFixed(2)}ms</span>
              </div>
            )}
          </div>

          {/* Row flow visualization */}
          {(node.actualRows !== null || node.rows !== null) && (
            <div className="flex items-center gap-2 mt-2 text-xs">
              {totalRowsScanned !== null && rowsFiltered ? (
                // Show filter flow: input → filtered → output
                <div className="flex items-center gap-1.5 bg-surface-200 rounded-md px-2 py-1">
                  <span className="text-foreground-lighter">
                    {totalRowsScanned.toLocaleString()} rows
                  </span>
                  <ArrowRight size={10} className="text-foreground-muted" />
                  <span className="text-destructive-600 font-medium">
                    -{rowsFiltered.toLocaleString()}
                  </span>
                  <ArrowRight size={10} className="text-foreground-muted" />
                  <span className="text-brand font-medium">
                    {node.actualRows?.toLocaleString()} rows
                  </span>
                </div>
              ) : (
                // Simple row count
                <div className="flex items-center gap-2 bg-surface-200 rounded-md px-2 py-1">
                  {node.rows !== null && (
                    <span className="text-foreground-lighter">
                      est. {node.rows.toLocaleString()}
                    </span>
                  )}
                  {node.actualRows !== null && (
                    <>
                      {node.rows !== null && (
                        <ArrowRight size={10} className="text-foreground-muted" />
                      )}
                      <span className="text-foreground-light font-medium">
                        {node.actualRows.toLocaleString()} rows
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Detail lines (Filter, Hash Cond, etc.) */}
          {detailLines.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {detailLines.map((detail, idx) => {
                // Skip the first line if it was already shown as the target
                if (idx === 0 && !detail.includes(':')) return null
                // Skip "Rows Removed" as we show it in the flow visualization
                if (detail.includes('Rows Removed by Filter')) return null
                return (
                  <div
                    key={idx}
                    className="text-xs text-foreground-lighter font-mono bg-surface-100 px-2 py-1 rounded"
                  >
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
