import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from 'ui'
import { RowCountIndicator } from './ExplainVisualizer.RowCountIndicator'
import type { ExplainNode } from './ExplainVisualizer.types'

interface ExplainNodeRowProps {
  node: ExplainNode
  depth: number
  maxTime: number
  /** Width of the left section (synced across all rows) */
  leftSectionWidth: number
}

function formatTime(ms: number | undefined): string {
  if (ms === undefined) return '-'
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`
  if (ms >= 1) return `${ms.toFixed(2)}ms`
  return `${ms.toFixed(2)}ms`
}

/**
 * Parse node details into structured lines for display
 */
function parseDetailLines(details: string): { label: string; value: string }[] {
  if (!details) return []

  const lines = details.split('\n').filter(Boolean)
  const result: { label: string; value: string }[] = []

  for (const line of lines) {
    const colonIndex = line.indexOf(':')
    if (colonIndex > 0) {
      result.push({
        label: line.substring(0, colonIndex + 1),
        value: line.substring(colonIndex + 1).trim(),
      })
    } else if (line.trim()) {
      // Lines without colons (like table names)
      result.push({ label: '', value: line.trim() })
    }
  }

  return result
}

export function ExplainNodeRow({ node, depth, maxTime, leftSectionWidth }: ExplainNodeRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const hasChildren = node.children.length > 0
  const hasDetails = Boolean(node.details?.trim())
  const canExpand = hasDetails

  const detailLines = parseDetailLines(node.details)
  const indentPx = depth * 24

  // Calculate time bar position and width
  const actualTimeEnd = node.actualTime?.end ?? 0
  const timeBarWidth = maxTime > 0 ? (actualTimeEnd / maxTime) * 100 : 0

  // Calculate the starting position of the time bar based on start time
  const actualTimeStart = node.actualTime?.start ?? 0
  const timeBarLeft = maxTime > 0 ? (actualTimeStart / maxTime) * 100 : 0

  return (
    <>
      {/* Main row */}
      <div
        className={cn(
          'flex items-stretch border-b border-border-muted transition-colors',
          isExpanded ? 'bg-surface-100' : 'bg-studio hover:bg-surface-100/50'
        )}
      >
        {/* Left section: expand button + operation info */}
        <div
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ width: leftSectionWidth, paddingLeft: `${16 + indentPx}px` }}
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

        {/* Right section: time bar visualization */}
        <div className="flex-1 relative min-h-[43px]">
          {node.actualTime && (
            <div
              className="absolute top-0 h-full bg-white/[0.03] flex flex-col items-start justify-center px-4 py-2"
              style={{
                left: `${timeBarLeft}%`,
                width: `${Math.max(timeBarWidth - timeBarLeft, 0)}%`,
                minWidth: 'fit-content',
              }}
            >
              <div className="flex items-center gap-2 font-mono text-xs whitespace-nowrap">
                <span className="text-foreground-light">{formatTime(node.actualTime.end)}</span>
                <span className="text-foreground-muted">/</span>
                <RowCountIndicator
                  actualRows={node.actualRows}
                  estimatedRows={node.rows}
                  rowsRemovedByFilter={node.rowsRemovedByFilter}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Expanded details section */}
      {isExpanded && detailLines.length > 0 && (
        <div
          className="border-b border-border-muted bg-surface-100"
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

      {/* Render children recursively */}
      {hasChildren &&
        node.children.map((child, idx) => (
          <ExplainNodeRow
            key={idx}
            node={child}
            depth={depth + 1}
            maxTime={maxTime}
            leftSectionWidth={leftSectionWidth}
          />
        ))}
    </>
  )
}
