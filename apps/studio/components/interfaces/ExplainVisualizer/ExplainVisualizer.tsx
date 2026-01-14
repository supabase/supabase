import { useMemo } from 'react'
import { ExplainHeader } from './ExplainVisualizer.Header'
import { ExplainNodeRow } from './ExplainVisualizer.NodeRow'
import { calculateMaxDuration, calculateSummary, createNodeTree } from './ExplainVisualizer.parser'
import type { QueryPlanRow } from './ExplainVisualizer.types'

export interface ExplainVisualizerProps {
  rows: readonly QueryPlanRow[]
  onShowRaw?: () => void
}

export function ExplainVisualizer({ rows, onShowRaw }: ExplainVisualizerProps) {
  const parsedTree = useMemo(() => createNodeTree(rows), [rows])
  const maxDuration = useMemo(() => calculateMaxDuration(parsedTree), [parsedTree])
  const summary = useMemo(() => calculateSummary(parsedTree), [parsedTree])

  if (parsedTree.length === 0) {
    return (
      <div className="bg-studio border-t">
        <p className="m-0 border-0 px-4 py-3 font-mono text-sm text-foreground-light">
          No execution plan data available
        </p>
      </div>
    )
  }

  return (
    <div className="bg-studio border-t h-full flex flex-col min-h-0">
      {onShowRaw && <ExplainHeader mode="visual" onToggleMode={onShowRaw} summary={summary} />}

      {/* Plan nodes */}
      <div className="flex-1 overflow-auto min-h-0">
        <div className="flex flex-col min-w-max pb-4">
          {parsedTree.map((node, idx) => (
            <ExplainNodeRow key={idx} node={node} depth={0} maxDuration={maxDuration} />
          ))}
        </div>
      </div>
    </div>
  )
}
