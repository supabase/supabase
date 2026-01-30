/**
 * Types for the Database Planner flow
 * The planner is powered by a Mermaid diagram, parsed at build time
 */

export type NodeType = 'symptom' | 'diagnostic' | 'solution' | 'future'

export interface FlowNode {
  id: string
  label: string
  description?: string
  type: NodeType
  /** For solutions: pricing info */
  pricing?: string
  /** For solutions: key benefits */
  benefits?: string[]
  /** Documentation or feature URL */
  url?: string
  /** Icon identifier */
  icon?: string
}

export interface FlowEdge {
  from: string
  to: string
  label?: string
  /** Dotted lines indicate future/optional paths */
  isDotted?: boolean
}

export interface ParsedFlow {
  nodes: Map<string, FlowNode>
  edges: FlowEdge[]
  symptoms: FlowNode[]
  solutions: FlowNode[]
}

export interface FlowState {
  /** The path of node IDs the user has traversed */
  path: string[]
  /** Current node ID */
  currentNodeId: string | null
  /** Whether the user has reached a solution */
  isComplete: boolean
}

