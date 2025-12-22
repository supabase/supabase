import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { cn, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { RowCountIndicator } from './ExplainVisualizer.RowCountIndicator'
import type { ExplainNode } from './ExplainVisualizer.types'
import { parseDetailLines } from './ExplainVisualizer.parser'
import { formatNodeDuration, getScanBarColor, getScanBorderColor } from './ExplainVisualizer.utils'

interface ExplainNodeRowProps {
  node: ExplainNode
  depth: number
  /** Maximum duration across all nodes, used to calculate bar width as % */
  maxDuration: number
}

export function ExplainNodeRow({ node, depth, maxDuration }: ExplainNodeRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasChildren = node.children.length > 0
  const hasDetails = Boolean(node.details?.trim())
  const canExpand = hasDetails

  const detailLines = parseDetailLines(node.details)
  const indentPx = depth * 24

  // Calculate duration and bar width as % of max duration
  const duration = node.actualTime ? node.actualTime.end - node.actualTime.start : 0
  const hasTimingData = node.actualTime && duration > 0
  const barWidthPercent = maxDuration > 0 ? (duration / maxDuration) * 100 : 0
  const barColorClass = getScanBarColor(node.operation)
  const borderColorClass = getScanBorderColor(node.operation)

  return (
    <>
      {/* Wrapper for group hover */}
      <div className="group">
        {/* Main row */}
        <div
          className={cn(
            'flex items-stretch border-b-border-muted border-b border-l-4 transition-colors bg-studio group-hover:bg-surface-100/50',
            borderColorClass
          )}
        >
          {/* Left section: expand button + operation info */}
          <div
            className="flex items-center gap-3 px-4 py-3 shrink-0 min-w-[400px]"
            style={{ paddingLeft: `${16 + indentPx}px` }}
          >
            {/* Expand/collapse button */}
            <button
              type="button"
              onClick={() => canExpand && setIsExpanded(!isExpanded)}
              disabled={!canExpand}
              className={cn(
                'flex items-center justify-center w-5 h-5 rounded border border-border-muted shrink-0',
                canExpand ? 'hover:bg-surface-200 cursor-pointer' : 'opacity-30 cursor-default'
              )}
              aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            >
              {isExpanded ? (
                <ChevronDown size={12} className="text-foreground-light" />
              ) : (
                <ChevronRight size={12} className="text-foreground-light" />
              )}
            </button>

            {/* Operation name and cost info */}
            <div className="flex items-center gap-2 font-mono text-xs min-w-0">
              <span className="text-foreground uppercase font-medium whitespace-nowrap">
                {node.operation}
              </span>
              <span className="text-foreground-muted whitespace-nowrap">
                (cost {node.cost?.end?.toFixed(1) ?? '-'}, estimated{' '}
                {node.rows?.toLocaleString() ?? '?'} {node.rows === 1 ? 'row' : 'rows'})
              </span>
            </div>
          </div>

          {/* Right section: duration bar visualization */}
          <div className="flex-1 relative min-h-[43px] flex items-center">
            {hasTimingData && (
              <>
                {/* Duration bar - width represents % of slowest operation */}
                <div
                  className={cn('absolute left-0 top-0 h-full', barColorClass)}
                  style={{ width: `${barWidthPercent}%` }}
                />
                {/* Duration and row count info */}
                <div className="relative flex items-center gap-2 font-mono text-xs whitespace-nowrap px-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-foreground-light cursor-help">
                        {formatNodeDuration(duration)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs font-sans">
                      <p className="font-medium">Execution time: {formatNodeDuration(duration)}</p>
                      <p className="text-foreground-lighter text-xs mt-1">
                        This is how long this operation took to execute. The bar width shows this as
                        a percentage of the slowest operation ({Math.round(barWidthPercent)}%) —
                        wider bars indicate where more time is spent.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-foreground-muted">/</span>
                  <RowCountIndicator
                    actualRows={node.actualRows}
                    estimatedRows={node.rows}
                    rowsRemovedByFilter={node.rowsRemovedByFilter}
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Expanded details section */}
        {isExpanded && detailLines.length > 0 && (
          <div
            className={cn(
              'border-b-border-muted border-b border-l-4 bg-studio group-hover:bg-surface-100/50',
              borderColorClass
            )}
            style={{ paddingLeft: `${16 + indentPx + 32}px` }}
          >
            <div className="px-4 py-3 space-y-2 font-mono text-xs">
              {detailLines.map((line, idx) => (
                <div key={idx} className="flex items-start gap-1">
                  {line.label && <span className="text-foreground-muted">{line.label}</span>}
                  <span className="text-foreground-light break-all">{line.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Render children recursively */}
      {hasChildren &&
        node.children.map((child, idx) => (
          <ExplainNodeRow key={idx} node={child} depth={depth + 1} maxDuration={maxDuration} />
        ))}
    </>
  )
}
