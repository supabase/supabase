import {
  Activity,
  ArrowDown,
  Clock,
  Database,
  GitMerge,
  Hash,
  Layers,
  ListFilter,
  SortAsc,
  Zap,
} from 'lucide-react'
import { useMemo } from 'react'
import { Badge, Button, cn } from 'ui'

interface ExplainNode {
  operation: string
  details: string
  cost: { start: number; end: number } | null
  rows: number | null
  width: number | null
  actualTime: { start: number; end: number } | null
  actualRows: number | null
  level: number
  children: ExplainNode[]
  raw: string
  // Parsed detail fields
  rowsRemovedByFilter?: number
  // Assigned during rendering
  _stepNumber?: number
}

interface QueryPlanRow {
  'QUERY PLAN': string
}

interface ExplainVisualizerProps {
  rows: readonly QueryPlanRow[]
  onShowRaw?: () => void
}

// Parse the QUERY PLAN text into a tree structure
function parseExplainOutput(rows: readonly QueryPlanRow[]): ExplainNode[] {
  const lines = rows.map((row) => row['QUERY PLAN'] || '').filter(Boolean)
  const root: ExplainNode[] = []
  const stack: { node: ExplainNode; indent: number }[] = []

  // Detail line patterns that should be attached to the previous node
  const detailPatterns =
    /^(Filter|Sort Key|Group Key|Hash Cond|Join Filter|Index Cond|Recheck Cond|Rows Removed by Filter|Rows Removed by Index Recheck|Output|Merge Cond|Sort Method|Worker \d+|Buffers|Planning Time|Execution Time|One-Time Filter|InitPlan|SubPlan):/

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip empty lines
    if (!line.trim()) continue

    // Calculate the indentation (number of leading spaces)
    const leadingMatch = line.match(/^(\s*)/)
    const leadingSpaces = leadingMatch ? leadingMatch[1].length : 0

    // Check if this line has an arrow (indicates a child operation node)
    const hasArrow = line.includes('->')

    // Extract the content after any arrow
    let content = line
    let effectiveIndent = leadingSpaces

    if (hasArrow) {
      // Find position of -> and use that for indent calculation
      const arrowIndex = line.indexOf('->')
      effectiveIndent = arrowIndex
      content = line.substring(arrowIndex + 2).trim()
    } else {
      content = line.trim()
    }

    // Skip Planning Time and Execution Time summary lines (at root level)
    if (
      content.startsWith('Planning Time:') ||
      content.startsWith('Execution Time:') ||
      content.startsWith('Planning:') ||
      content.startsWith('Execution:')
    ) {
      continue
    }

    // Check if this is a detail line (like Filter:, Sort Key:, etc.)
    if (detailPatterns.test(content) && stack.length > 0) {
      // Attach to the most recent node at or above this indentation
      const currentNode = stack[stack.length - 1].node
      currentNode.details += (currentNode.details ? '\n' : '') + content
      continue
    }

    // Check if this is a continuation of details (indented text without operation pattern)
    // These are typically wrapped condition expressions
    if (!hasArrow && stack.length > 0 && leadingSpaces > 0) {
      const lastItem = stack[stack.length - 1]
      // If it's more indented than the last node and doesn't look like an operation
      if (leadingSpaces > lastItem.indent && !content.match(/^\w+.*\(cost=/)) {
        lastItem.node.details += (lastItem.node.details ? '\n' : '') + content
        continue
      }
    }

    // Parse main operation line: "Operation on table (metrics)"
    // Match operation with optional metrics in parentheses
    // Handle multiple metric groups like (cost=...) (actual time=...)
    const metricsMatch = content.match(/^(.+?)\s*(\([^)]*cost=[^)]+\)(?:\s*\([^)]+\))*)?\s*$/)

    if (!metricsMatch) {
      continue
    }

    const [, operationPart, metricsStr] = metricsMatch
    const metrics = metricsStr
      ? metricsStr.replace(/^\(|\)$/g, '').replace(/\)\s*\(/g, ' ')
      : undefined

    // Split operation and object name (e.g., "Seq Scan on users" -> operation: "Seq Scan", details: "users")
    let operation = operationPart.trim()
    let details = ''

    // Check for "on tablename" or "using indexname" patterns
    const onMatch = operationPart.match(/^(.+?)\s+on\s+(.+)$/i)
    const usingMatch = operationPart.match(/^(.+?)\s+using\s+(.+)$/i)

    if (onMatch) {
      operation = onMatch[1].trim()
      details = 'on ' + onMatch[2].trim()
    } else if (usingMatch) {
      operation = usingMatch[1].trim()
      details = 'using ' + usingMatch[2].trim()
    }

    // Calculate the tree level based on indentation
    // PostgreSQL typically uses 6 spaces per level for -> nodes
    const level = hasArrow ? Math.floor(effectiveIndent / 6) + 1 : 0

    const node = createNode(operation, details, metrics, level, line)
    addNodeToTree(node, effectiveIndent, root, stack)
  }

  return root
}

function createNode(
  operation: string,
  details: string | undefined,
  metrics: string | undefined,
  level: number,
  raw: string
): ExplainNode {
  const node: ExplainNode = {
    operation: operation.trim(),
    details: details?.trim() || '',
    cost: null,
    rows: null,
    width: null,
    actualTime: null,
    actualRows: null,
    level,
    children: [],
    raw,
  }

  if (metrics) {
    // Parse cost=start..end
    const costMatch = metrics.match(/cost=([\d.]+)\.\.([\d.]+)/)
    if (costMatch) {
      node.cost = { start: parseFloat(costMatch[1]), end: parseFloat(costMatch[2]) }
    }

    // Parse rows=N
    const rowsMatch = metrics.match(/rows=(\d+)/)
    if (rowsMatch) {
      node.rows = parseInt(rowsMatch[1], 10)
    }

    // Parse width=N
    const widthMatch = metrics.match(/width=(\d+)/)
    if (widthMatch) {
      node.width = parseInt(widthMatch[1], 10)
    }

    // Parse actual time=start..end
    const actualTimeMatch = metrics.match(/actual time=([\d.]+)\.\.([\d.]+)/)
    if (actualTimeMatch) {
      node.actualTime = {
        start: parseFloat(actualTimeMatch[1]),
        end: parseFloat(actualTimeMatch[2]),
      }
    }

    // Parse actual rows=N
    const actualRowsMatch = metrics.match(/actual rows=(\d+)/)
    if (actualRowsMatch) {
      node.actualRows = parseInt(actualRowsMatch[1], 10)
    }
  }

  return node
}

// After node creation, parse detail fields like "Rows Removed by Filter"
function parseNodeDetails(node: ExplainNode): void {
  if (node.details) {
    const rowsRemovedMatch = node.details.match(/Rows Removed by Filter:\s*(\d+)/)
    if (rowsRemovedMatch) {
      node.rowsRemovedByFilter = parseInt(rowsRemovedMatch[1], 10)
    }
  }
  node.children.forEach(parseNodeDetails)
}

// Get human-readable description for an operation
function getOperationDescription(operation: string, node: ExplainNode): string {
  const op = operation.toLowerCase()

  if (op.includes('seq scan')) {
    return 'Reads entire table row by row'
  }
  if (op.includes('index only scan')) {
    return 'Reads data directly from index (fastest)'
  }
  if (op.includes('index scan')) {
    return 'Uses index to find matching rows'
  }
  if (op.includes('bitmap index scan')) {
    return 'Builds bitmap of matching rows from index'
  }
  if (op.includes('bitmap heap scan')) {
    return 'Fetches rows using bitmap'
  }
  if (op.includes('hash join')) {
    return 'Joins tables using hash lookup'
  }
  if (op.includes('merge join')) {
    return 'Joins pre-sorted tables'
  }
  if (op.includes('nested loop')) {
    return 'Joins by looping through each row'
  }
  if (op === 'hash') {
    return 'Builds hash table for fast lookups'
  }
  if (op.includes('sort')) {
    return 'Sorts rows for output or join'
  }
  if (op.includes('aggregate') || op.includes('group')) {
    return 'Groups rows and calculates aggregates'
  }
  if (op.includes('limit')) {
    return 'Returns only first N rows'
  }
  if (op.includes('materialize')) {
    return 'Stores results in memory for reuse'
  }
  if (op.includes('gather')) {
    return 'Collects results from parallel workers'
  }

  return ''
}

function addNodeToTree(
  node: ExplainNode,
  indent: number,
  root: ExplainNode[],
  stack: { node: ExplainNode; indent: number }[]
) {
  // Remove nodes from stack that are at the same or deeper indentation
  while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
    stack.pop()
  }

  if (stack.length === 0) {
    root.push(node)
  } else {
    stack[stack.length - 1].node.children.push(node)
  }

  stack.push({ node, indent })
}

// Get an icon for the operation type
function getOperationIcon(operation: string) {
  const op = operation.toLowerCase()
  if (op === 'hash') return Hash
  if (op.includes('hash join')) return GitMerge
  if (op.includes('merge join')) return GitMerge
  if (op.includes('nested loop')) return GitMerge
  if (op.includes('join')) return Layers
  if (op.includes('index')) return Zap
  if (op.includes('seq scan')) return Database
  if (op.includes('scan')) return Database
  if (op.includes('filter')) return ListFilter
  if (op.includes('sort')) return SortAsc
  if (op.includes('aggregate') || op.includes('group')) return Activity
  return Database
}

// Get a color class for the operation type
function getOperationColor(operation: string): string {
  const op = operation.toLowerCase()
  if (op.includes('seq scan')) return 'text-warning'
  if (op.includes('index')) return 'text-brand'
  if (op.includes('join')) return 'text-purple-500'
  if (op.includes('sort') || op.includes('aggregate')) return 'text-blue-500'
  return 'text-foreground'
}

// Render a single node in the tree
function ExplainNodeRenderer({
  node,
  isLast,
  depth,
  maxCost,
  parentHasMore,
  stepNumber,
  totalSteps,
}: {
  node: ExplainNode
  isLast: boolean
  depth: number
  maxCost: number
  parentHasMore: boolean[]
  stepNumber: number
  totalSteps: number
}) {
  const Icon = getOperationIcon(node.operation)
  const colorClass = getOperationColor(node.operation)
  const costValue = node.cost?.end || node.actualTime?.end || 0
  const costWidth = maxCost > 0 ? (costValue / maxCost) * 100 : 0
  const description = getOperationDescription(node.operation, node)

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
        {/* Step number */}
        <div className="flex flex-col items-center gap-1">
          <div
            className={cn(
              'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
              stepNumber === totalSteps
                ? 'bg-brand/20 text-brand'
                : 'bg-surface-300 text-foreground-light'
            )}
          >
            {stepNumber}
          </div>
          {node.children.length > 0 && <ArrowDown size={12} className="text-foreground-muted" />}
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
                  <ArrowDown size={10} className="text-foreground-muted rotate-[-90deg]" />
                  <span className="text-destructive-600 font-medium">
                    -{rowsFiltered.toLocaleString()}
                  </span>
                  <ArrowDown size={10} className="text-foreground-muted rotate-[-90deg]" />
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
                        <ArrowDown size={10} className="text-foreground-muted rotate-[-90deg]" />
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
              stepNumber={child._stepNumber ?? 0}
              totalSteps={totalSteps}
            />
          ))}
        </div>
      )}
    </div>
  )
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
