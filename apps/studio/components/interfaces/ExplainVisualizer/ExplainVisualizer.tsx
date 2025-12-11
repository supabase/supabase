import { Activity, ArrowUp, Clock, Database, GitMerge, Hash, Zap } from 'lucide-react'
import { useMemo } from 'react'
import { Badge, Button } from 'ui'
import { ExplainNodeRenderer } from './ExplainNodeRenderer'
import { calculateMaxCost, calculateSummary, parseExplainOutput, parseNodeDetails } from './parser'
import type { ExplainNode, QueryPlanRow } from './types'

export interface ExplainVisualizerProps {
  rows: readonly QueryPlanRow[]
  onShowRaw?: () => void
}

export function ExplainVisualizer({ rows, onShowRaw }: ExplainVisualizerProps) {
  const parsedTree = useMemo(() => {
    const tree = parseExplainOutput(rows)
    // Parse additional details from each node
    tree.forEach(parseNodeDetails)
    return tree
  }, [rows])

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
      {/* Header */}
      <div className="bg-surface-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-foreground-light" />
          <h3 className="text-sm font-medium text-foreground">Query Execution Plan</h3>
          {onShowRaw && (
            <Button type="default" size="tiny" className="ml-auto" onClick={onShowRaw}>
              Show Raw
            </Button>
          )}
        </div>

        {/* Summary stats */}
        <div className="flex items-center gap-4 mt-2 flex-wrap">
          {summary.totalTime > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <Clock size={12} className="text-foreground-muted" />
              <span className="text-foreground-light">Total:</span>
              <span className="font-mono font-medium text-foreground">
                {summary.totalTime.toFixed(2)}ms
              </span>
            </div>
          )}
          {summary.hasSeqScan && !summary.hasIndexScan && (
            <Badge variant="warning" className="text-xs gap-1">
              <Database size={10} />
              Sequential scan detected
            </Badge>
          )}
        </div>
      </div>

      <div className="px-4 py-2 bg-surface-100 border-b text-xs text-foreground-lighter">
        <div className="flex items-center gap-2 mb-4">
          <ArrowUp size={12} className="text-foreground-light" />
          <span className="font-medium text-foreground-light">How to read:</span>
          <span>
            Start at the bottom where data is read from tables, then follow upward as each step
            processes the results.
          </span>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Database size={12} className="text-warning" />
            <span>Seq Scan (full table read)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-brand" />
            <span>Index Scan (fast lookup)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GitMerge size={12} className="text-foreground-light" />
            <span>Join</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Hash size={12} className="text-foreground-light" />
            <span>Hash (lookup table)</span>
          </div>
        </div>
      </div>

      {/* Tree visualization */}
      <div className="p-4 overflow-auto flex-1">
        {parsedTree.map((node, idx) => (
          <ExplainNodeRenderer
            key={idx}
            node={node}
            isLast={idx === parsedTree.length - 1}
            depth={0}
            maxCost={maxCost}
            parentHasMore={[]}
            isRoot={true}
          />
        ))}
      </div>
    </div>
  )
}
