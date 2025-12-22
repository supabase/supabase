import { useMemo } from 'react'
import { ExplainHeader } from './ExplainVisualizer.Header'
import { ExplainNodeRow } from './ExplainVisualizer.NodeRow'
import { TimelineHeader } from './ExplainVisualizer.TimelineHeader'
import {
  calculateMaxTime,
  calculateSummary,
  createNodeTree,
} from './ExplainVisualizer.parser'
import type { QueryPlanRow } from './ExplainVisualizer.types'

export interface ExplainVisualizerProps {
  rows: readonly QueryPlanRow[]
  onShowRaw?: () => void
}

// Width of the left section containing operation names and cost info
const LEFT_SECTION_WIDTH = 450

export function ExplainVisualizer({ rows, onShowRaw }: ExplainVisualizerProps) {
  const parsedTree = useMemo(() => createNodeTree(rows), [rows])
  const maxTime = useMemo(() => calculateMaxTime(parsedTree), [parsedTree])
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
    <div className="bg-studio border-t h-full flex flex-col">
      {onShowRaw && <ExplainHeader mode="visual" onToggleMode={onShowRaw} summary={summary} />}

      {/* Timeline header and rows container */}
      <div className="flex-1 overflow-auto">
        {/* Timeline header with time markers */}
        {maxTime > 0 && (
          <TimelineHeader maxTime={maxTime} leftSectionWidth={LEFT_SECTION_WIDTH} />
        )}

        {/* Flat list of plan nodes */}
        <div className="flex flex-col">
          {parsedTree.map((node, idx) => (
            <ExplainNodeRow
              key={idx}
              node={node}
              depth={0}
              maxTime={maxTime}
              leftSectionWidth={LEFT_SECTION_WIDTH}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
