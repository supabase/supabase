import { Activity, Clock, Database, GitMerge, Hash, Zap } from 'lucide-react'
import { useMemo } from 'react'
import { Badge, Button } from 'ui'
import { ExplainNodeRenderer } from './ExplainNodeRenderer'
import { parseExplainOutput, parseNodeDetails } from './parser'
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

  // Calculate max cost for scaling the visualization bars
  const maxCost = useMemo(() => {
    let max = 0
    const traverse = (node: ExplainNode) => {
      const cost = node.cost?.end || node.actualTime?.end || 0
      if (cost > max) max = cost
      node.children.forEach(traverse)
    }
    parsedTree.forEach(traverse)
    return max
  }, [parsedTree])

  // Assign step numbers and calculate total steps
  // PostgreSQL executes children in reverse order for joins:
  // - For Hash Join: the Hash (inner/build) side executes first, then the outer/probe side
  // - The second child in EXPLAIN output is typically the "build" side
  const totalSteps = useMemo(() => {
    let stepCounter = 1
    const assignSteps = (node: ExplainNode) => {
      // Process children in REVERSE order (inner/build side first, then outer/probe)
      // This matches PostgreSQL's actual execution order
      const children = [...node.children].reverse()
      children.forEach(assignSteps)
      node._stepNumber = stepCounter++
    }
    parsedTree.forEach(assignSteps)
    return stepCounter - 1
  }, [parsedTree])

  // Calculate summary stats
  const summary = useMemo(() => {
    const stats = {
      totalTime: 0,
      totalCost: 0,
      hasSeqScan: false,
      seqScanTables: [] as string[],
      hasIndexScan: false,
    }

    const traverse = (node: ExplainNode) => {
      if (node.actualTime) {
        stats.totalTime = Math.max(stats.totalTime, node.actualTime.end)
      }
      if (node.cost) {
        stats.totalCost = Math.max(stats.totalCost, node.cost.end)
      }
      const op = node.operation.toLowerCase()
      if (op.includes('seq scan')) {
        stats.hasSeqScan = true
        const tableMatch = node.details.match(/on\s+(\w+)/)
        if (tableMatch) stats.seqScanTables.push(tableMatch[1])
      }
      if (op.includes('index')) {
        stats.hasIndexScan = true
      }
      node.children.forEach(traverse)
    }
    parsedTree.forEach(traverse)
    return stats
  }, [parsedTree])

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
      <div className="border-b bg-surface-100 px-4 py-3">
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
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-foreground-light">Steps:</span>
            <span className="font-mono font-medium text-foreground">{totalSteps}</span>
          </div>
          {summary.hasSeqScan && !summary.hasIndexScan && (
            <Badge variant="warning" className="text-xs gap-1">
              <Database size={10} />
              Sequential scan detected
            </Badge>
          )}
        </div>
      </div>

      {/* How to read hint */}
      <div className="px-4 py-2 bg-surface-200/50 border-b text-xs text-foreground-lighter flex items-center gap-2">
        <span className="font-medium text-foreground-light">How to read:</span>
        <span>Steps are numbered in execution order.</span>
        <span className="text-border">•</span>
        <span>Child operations (indented) run first and feed data up to their parent.</span>
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
            stepNumber={node._stepNumber ?? 0}
            totalSteps={totalSteps}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="border-t bg-surface-100 px-4 py-2.5 flex-shrink-0">
        <div className="flex items-center gap-4 text-xs text-foreground-lighter flex-wrap">
          <div className="flex items-center gap-1.5">
            <Database size={12} className="text-warning" />
            <span>Seq Scan (full table read)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap size={12} className="text-brand" />
            <span>Index Scan (fast lookup)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <GitMerge size={12} className="text-purple-500" />
            <span>Join</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Hash size={12} className="text-foreground-light" />
            <span>Hash (lookup table)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
