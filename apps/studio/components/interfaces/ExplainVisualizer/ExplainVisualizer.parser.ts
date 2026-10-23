import type { ExplainNode, QueryPlanRow } from './ExplainVisualizer.types'

export interface ExplainSummary {
  totalTime: number
  totalCost: number
  maxCost: number
  hasSeqScan: boolean
  seqScanTables: string[]
  hasIndexScan: boolean
}

function parseFloatMetric(value: string): number | undefined {
  const parsed = parseFloat(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseIntMetric(value: string): number | undefined {
  const parsed = parseInt(value, 10)
  return Number.isNaN(parsed) ? undefined : parsed
}

// Parse the QUERY PLAN text into a tree structure
export function parseExplainOutput(rows: readonly QueryPlanRow[]): ExplainNode[] {
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
    level,
    children: [],
    raw,
  }

  if (metrics) {
    // Parse cost=start..end
    const costMatch = metrics.match(/cost=([\d.]+)\.\.([\d.]+)/)
    if (costMatch) {
      const start = parseFloatMetric(costMatch[1])
      const end = parseFloatMetric(costMatch[2])
      // Only set cost if both values are valid numbers
      if (start !== undefined && end !== undefined) {
        node.cost = { start, end }
      }
    }

    // Parse rows=N (estimated rows, always the first occurrence)
    const rowsMatch = metrics.match(/rows=(\d+)/)
    if (rowsMatch) {
      node.rows = parseIntMetric(rowsMatch[1])
    }

    // Parse width=N
    const widthMatch = metrics.match(/width=(\d+)/)
    if (widthMatch) {
      node.width = parseIntMetric(widthMatch[1])
    }

    // Parse actual time=start..end
    const actualTimeMatch = metrics.match(/actual time=([\d.]+)\.\.([\d.]+)/)
    if (actualTimeMatch) {
      const start = parseFloatMetric(actualTimeMatch[1])
      const end = parseFloatMetric(actualTimeMatch[2])
      // Only set actualTime if both values are valid numbers
      if (start !== undefined && end !== undefined) {
        node.actualTime = { start, end }
      }

      // When EXPLAIN ANALYZE is used, the second rows= value (after actual time) is the actual rows
      const actualTimePart = metrics.substring(metrics.indexOf('actual time='))
      const actualRowsMatch = actualTimePart.match(/rows=(\d+)/)
      if (actualRowsMatch) {
        node.actualRows = parseIntMetric(actualRowsMatch[1])
      }
    }
  }

  return node
}

// After node creation, parse detail fields like "Rows Removed by Filter"
export function parseNodeDetails(node: ExplainNode): void {
  if (node.details) {
    const rowsRemovedMatch = node.details.match(/Rows Removed by Filter:\s*(\d+)/)
    if (rowsRemovedMatch) {
      node.rowsRemovedByFilter = parseIntMetric(rowsRemovedMatch[1])
    }
  }
  node.children.forEach(parseNodeDetails)
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

// Calculate max cost for scaling the visualization bars
function getNodeMaxCost(node: ExplainNode): number {
  const nodeCost = node.cost?.end || node.actualTime?.end || 0
  const childrenMax = node.children.reduce((max, child) => Math.max(max, getNodeMaxCost(child)), 0)
  return Math.max(nodeCost, childrenMax)
}

export function calculateMaxCost(tree: ExplainNode[]): number {
  return tree.reduce((max, node) => Math.max(max, getNodeMaxCost(node)), 0)
}

// Calculate max duration across all nodes for scaling the visualization bars
function getNodeMaxDuration(node: ExplainNode): number {
  const nodeDuration = node.actualTime ? node.actualTime.end - node.actualTime.start : 0
  const childrenMax = node.children.reduce(
    (max, child) => Math.max(max, getNodeMaxDuration(child)),
    0
  )
  return Math.max(nodeDuration, childrenMax)
}

export function calculateMaxDuration(tree: ExplainNode[]): number {
  return tree.reduce((max, node) => Math.max(max, getNodeMaxDuration(node)), 0)
}

// Calculate summary stats
export function calculateSummary(tree: ExplainNode[]): ExplainSummary {
  const stats: ExplainSummary = {
    totalTime: 0,
    totalCost: 0,
    maxCost: 0,
    hasSeqScan: false,
    seqScanTables: [],
    hasIndexScan: false,
  }

  const traverse = (node: ExplainNode) => {
    if (node.actualTime) {
      stats.totalTime = Math.max(stats.totalTime, node.actualTime.end)
    }
    if (node.cost) {
      stats.maxCost = Math.max(stats.maxCost, node.cost.end)
    }
    const op = node.operation.toLowerCase()
    if (op.includes('seq scan')) {
      stats.hasSeqScan = true
      const tableMatch = node.details.match(/on\s+((?:"[^"]+"|[\w]+)(?:\.(?:"[^"]+"|[\w]+))*)/)
      if (tableMatch) stats.seqScanTables.push(tableMatch[1])
    }
    if (op.includes('index')) {
      stats.hasIndexScan = true
    }
    node.children.forEach(traverse)
  }
  tree.forEach(traverse)

  stats.totalCost = tree[0]?.cost?.end ?? 0
  return stats
}

export function createNodeTree(rows: readonly QueryPlanRow[]): ExplainNode[] {
  const tree = parseExplainOutput(rows)

  // Parse additional details from each node
  tree.forEach(parseNodeDetails)
  return tree
}

export function parseDetailLines(details: string): { label: string; value: string }[] {
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
