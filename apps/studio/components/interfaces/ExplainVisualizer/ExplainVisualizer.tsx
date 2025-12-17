import { useMemo } from 'react'
import { ExplainHeader } from './ExplainVisualizer.Header'
import { ExplainNodeRenderer } from './ExplainVisualizer.NodeRenderer'
import { calculateMaxCost, calculateSummary, createNodeTree } from './ExplainVisualizer.parser'
import type { QueryPlanRow } from './ExplainVisualizer.types'

export interface ExplainVisualizerProps {
  rows: readonly QueryPlanRow[]
  onShowRaw?: () => void
}

export function ExplainVisualizer({ rows, onShowRaw }: ExplainVisualizerProps) {
  const parsedTree = useMemo(() => createNodeTree(rows), [rows])
  const maxCost = useMemo(() => calculateMaxCost(parsedTree), [parsedTree])
  const summary = useMemo(() => calculateSummary(parsedTree), [parsedTree])

  if (parsedTree.length === 0) {
    return (
      <div className="bg-table-header-light [[data-theme*=dark]_&]:bg-table-header-dark">
        <p className="m-0 border-0 px-4 py-3 font-mono text-sm text-foreground-light">
          No execution plan data available
        </p>
      </div>
    )
  }

  return (
    <div className="bg-studio border-t h-full flex flex-col">
      {onShowRaw && <ExplainHeader mode="visual" onToggleMode={onShowRaw} summary={summary} />}

      {/* Tree visualization */}
      <div className="p-4 pb-10 overflow-auto flex-1">
        {parsedTree.map((node, idx) => (
          <ExplainNodeRenderer key={idx} node={node} depth={0} maxCost={maxCost} isRoot={true} />
        ))}
      </div>
    </div>
  )
}
