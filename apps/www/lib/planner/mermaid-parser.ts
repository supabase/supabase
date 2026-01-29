/**
 * Mermaid Flowchart Parser
 *
 * Parses a subset of Mermaid flowchart syntax to power the Database Planner.
 * This allows the flow to be defined in a single Mermaid diagram and
 * automatically generates the interactive wizard UI.
 *
 * Supported syntax:
 * - subgraph NAME["Label"] ... end
 * - NODE_ID["Label"]
 * - NODE_ID{"Label"} (decision nodes)
 * - NODE_ID --> NODE_ID2
 * - NODE_ID -- "label" --> NODE_ID2
 * - NODE_ID -.-> NODE_ID2 (dotted lines)
 * - NODE_ID -.-> |"label"| NODE_ID2
 * - classDef name fill:...,stroke:...
 * - class NODE1,NODE2 className
 */

import type { FlowNode, FlowEdge, ParsedFlow, NodeType } from './types'

interface ParserState {
  nodes: Map<string, FlowNode>
  edges: FlowEdge[]
  currentSubgraph: string | null
  nodeClasses: Map<string, string>
  classToType: Map<string, NodeType>
}

/**
 * Extract node ID and label from various Mermaid node formats
 */
function parseNodeDefinition(
  text: string
): { id: string; label: string; isDecision: boolean } | null {
  // Decision node: ID{"Label"} or ID{Label}
  const decisionMatch = text.match(/^(\w+)\{([^}]+)\}$/)
  if (decisionMatch) {
    const label = decisionMatch[2].replace(/^["']|["']$/g, '')
    return { id: decisionMatch[1], label, isDecision: true }
  }

  // Regular node: ID["Label"] or ID[Label]
  const nodeMatch = text.match(/^(\w+)\[([^\]]+)\]$/)
  if (nodeMatch) {
    const label = nodeMatch[2].replace(/^["']|["']$/g, '')
    return { id: nodeMatch[1], label, isDecision: false }
  }

  return null
}

/**
 * Parse edge definitions from a line
 */
function parseEdge(line: string, state: ParserState): FlowEdge | null {
  // Dotted edge with label: NODE -.-> |"label"| NODE2 or NODE -.-> |label| NODE2
  const dottedWithLabel = line.match(/^(\w+)\s*-\.->(?:\s*\|([^|]+)\|)?\s*(\w+)$/)
  if (dottedWithLabel) {
    const label = dottedWithLabel[2]?.replace(/^["']|["']$/g, '').trim()
    return {
      from: dottedWithLabel[1],
      to: dottedWithLabel[3],
      label: label || undefined,
      isDotted: true,
    }
  }

  // Solid edge with label after arrow: NODE -- "label" --> NODE2
  const solidWithLabelAfter = line.match(/^(\w+)\s*--\s*["']([^"']+)["']\s*-->\s*(\w+)$/)
  if (solidWithLabelAfter) {
    return {
      from: solidWithLabelAfter[1],
      to: solidWithLabelAfter[3],
      label: solidWithLabelAfter[2].trim(),
      isDotted: false,
    }
  }

  // Solid edge with no label: NODE --> NODE2
  const solidNoLabel = line.match(/^(\w+)\s*-->\s*(\w+)$/)
  if (solidNoLabel) {
    return {
      from: solidNoLabel[1],
      to: solidNoLabel[2],
      isDotted: false,
    }
  }

  return null
}

/**
 * Parse class definitions
 */
function parseClassDef(line: string): { name: string; type: NodeType } | null {
  const match = line.match(/^classDef\s+(\w+)\s+(.+)$/)
  if (!match) return null

  const name = match[1]
  const styles = match[2].toLowerCase()

  // Determine type based on fill color
  if (styles.includes('#fee2e2') || styles.includes('red')) {
    return { name, type: 'symptom' }
  }
  if (styles.includes('#fef3c7') || styles.includes('yellow') || styles.includes('amber')) {
    return { name, type: 'diagnostic' }
  }
  if (styles.includes('#d1fae5') || styles.includes('green') || styles.includes('emerald')) {
    return { name, type: 'solution' }
  }
  if (styles.includes('#e0e7ff') || styles.includes('indigo') || styles.includes('purple')) {
    return { name, type: 'future' }
  }

  return null
}

/**
 * Parse class assignments
 */
function parseClassAssignment(
  line: string
): { nodeIds: string[]; className: string } | null {
  const match = line.match(/^class\s+([^\s]+)\s+(\w+)$/)
  if (!match) return null

  const nodeIds = match[1].split(',').map((id) => id.trim())
  return { nodeIds, className: match[2] }
}

/**
 * Main parser function
 */
export function parseMermaidFlow(mermaidCode: string): ParsedFlow {
  const state: ParserState = {
    nodes: new Map(),
    edges: [],
    currentSubgraph: null,
    nodeClasses: new Map(),
    classToType: new Map(),
  }

  const lines = mermaidCode.split('\n').map((l) => l.trim())

  // First pass: collect class definitions
  for (const line of lines) {
    const classDef = parseClassDef(line)
    if (classDef) {
      state.classToType.set(classDef.name, classDef.type)
    }

    const classAssignment = parseClassAssignment(line)
    if (classAssignment) {
      for (const nodeId of classAssignment.nodeIds) {
        state.nodeClasses.set(nodeId, classAssignment.className)
      }
    }
  }

  // Second pass: parse nodes and edges
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Skip empty lines and comments
    if (!line || line.startsWith('%%') || line.startsWith('flowchart')) {
      continue
    }

    // Subgraph start
    const subgraphMatch = line.match(/^subgraph\s+(\w+)\[["']([^"'\]]+)["']\]$/)
    if (subgraphMatch) {
      state.currentSubgraph = subgraphMatch[1]
      continue
    }

    // Subgraph end
    if (line === 'end') {
      state.currentSubgraph = null
      continue
    }

    // Skip styling lines
    if (line.startsWith('classDef') || line.startsWith('class ')) {
      continue
    }

    // Try to parse as edge first (since edges can contain node definitions)
    const edge = parseEdge(line, state)
    if (edge) {
      state.edges.push(edge)

      // Ensure nodes exist
      if (!state.nodes.has(edge.from)) {
        state.nodes.set(edge.from, {
          id: edge.from,
          label: edge.from,
          type: 'symptom',
        })
      }
      if (!state.nodes.has(edge.to)) {
        state.nodes.set(edge.to, {
          id: edge.to,
          label: edge.to,
          type: 'symptom',
        })
      }
      continue
    }

    // Try to parse as standalone node definition
    const nodeDef = parseNodeDefinition(line)
    if (nodeDef) {
      const type = nodeDef.isDecision ? 'diagnostic' : determineNodeType(nodeDef.id, state)
      state.nodes.set(nodeDef.id, {
        id: nodeDef.id,
        label: nodeDef.label,
        type,
      })
    }
  }

  // Apply class-based types to nodes
  for (const [nodeId, className] of state.nodeClasses) {
    const type = state.classToType.get(className)
    const node = state.nodes.get(nodeId)
    if (type && node) {
      node.type = type
    }
  }

  // Identify symptoms (nodes with only outgoing edges, no incoming from non-symptoms)
  const incomingCount = new Map<string, number>()
  for (const edge of state.edges) {
    const count = incomingCount.get(edge.to) || 0
    incomingCount.set(edge.to, count + 1)
  }

  const symptoms: FlowNode[] = []
  const solutions: FlowNode[] = []

  for (const node of state.nodes.values()) {
    if (node.type === 'symptom' && node.id.startsWith('S')) {
      symptoms.push(node)
    }
    if (node.type === 'solution' || node.type === 'future') {
      solutions.push(node)
    }
  }

  return {
    nodes: state.nodes,
    edges: state.edges,
    symptoms,
    solutions,
  }
}

/**
 * Determine node type based on ID prefix and context
 */
function determineNodeType(id: string, state: ParserState): NodeType {
  // Check if we have a class assignment
  const className = state.nodeClasses.get(id)
  if (className) {
    const type = state.classToType.get(className)
    if (type) return type
  }

  // Infer from ID prefix
  if (id.startsWith('S') && id.match(/^S\d+$/)) return 'symptom'
  if (id.startsWith('D') && id.match(/^D\d+$/)) return 'diagnostic'
  if (id.startsWith('SOL_')) return 'solution'

  // Default based on current subgraph
  if (state.currentSubgraph === 'SYMPTOMS') return 'symptom'
  if (state.currentSubgraph === 'DIAGNOSTICS') return 'diagnostic'
  if (state.currentSubgraph === 'SOLUTIONS') return 'solution'

  return 'symptom'
}

/**
 * Get the next options from a node
 */
export function getNextOptions(
  nodeId: string,
  flow: ParsedFlow
): { label: string; nodeId: string; isDotted: boolean }[] {
  const options: { label: string; nodeId: string; isDotted: boolean }[] = []

  for (const edge of flow.edges) {
    if (edge.from === nodeId) {
      const targetNode = flow.nodes.get(edge.to)
      const label = edge.label || targetNode?.label || edge.to
      options.push({
        label,
        nodeId: edge.to,
        isDotted: edge.isDotted || false,
      })
    }
  }

  return options
}

/**
 * Check if a node is a terminal node (solution)
 */
export function isTerminalNode(nodeId: string, flow: ParsedFlow): boolean {
  const node = flow.nodes.get(nodeId)
  if (!node) return false

  // Solutions and future nodes are terminal unless they have non-dotted outgoing edges
  if (node.type === 'solution' || node.type === 'future') {
    const hasNonDottedOutgoing = flow.edges.some(
      (e) => e.from === nodeId && !e.isDotted
    )
    return !hasNonDottedOutgoing
  }

  return false
}
