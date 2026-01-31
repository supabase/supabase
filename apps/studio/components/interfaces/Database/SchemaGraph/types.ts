import type { Node, Edge } from 'reactflow'
import type {
  DependencyGraphNode,
  DependencyGraphEdge,
  DependencyGraphNodeType,
  DependencyGraphEdgeType,
} from 'data/dependency-graph/dependency-graph-query'

export type SchemaGraphNodeData = DependencyGraphNode & {
  highlighted?: boolean
  dimmed?: boolean
}

export type SchemaGraphNode = Node<SchemaGraphNodeData>

export type SchemaGraphEdgeData = {
  type: DependencyGraphEdgeType
  label: string | null
  highlighted?: boolean
  dimmed?: boolean
}

export type SchemaGraphEdge = Edge<SchemaGraphEdgeData>

export const NODE_TYPE_COLORS: Record<DependencyGraphNodeType, string> = {
  table: '#3b82f6', // blue-500
  view: '#8b5cf6', // violet-500
  materialized_view: '#a855f7', // purple-500
  function: '#f59e0b', // amber-500
  trigger: '#ef4444', // red-500
  policy: '#10b981', // emerald-500
  index: '#6366f1', // indigo-500
  sequence: '#ec4899', // pink-500
  type: '#14b8a6', // teal-500
}

export const NODE_TYPE_LABELS: Record<DependencyGraphNodeType, string> = {
  table: 'Table',
  view: 'View',
  materialized_view: 'Materialized View',
  function: 'Function',
  trigger: 'Trigger',
  policy: 'Policy',
  index: 'Index',
  sequence: 'Sequence',
  type: 'Type',
}

export const EDGE_TYPE_LABELS: Record<DependencyGraphEdgeType, string> = {
  fk: 'Foreign Key',
  trigger_table: 'Trigger on Table',
  trigger_function: 'Trigger calls Function',
  policy: 'Policy on Table',
  index: 'Index on Table',
  view_dependency: 'View depends on',
  function_table: 'Function uses Table',
  sequence_owned: 'Sequence owned by',
}
