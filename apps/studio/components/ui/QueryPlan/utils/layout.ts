import { Position, type Edge, type Node } from 'reactflow'
import dagre from '@dagrejs/dagre'

import type { PlanNodeData } from '../types'
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH } from '../constants'

export const getNodesWithPositionsViaDagre = (
  nodes: Node<PlanNodeData>[],
  edges: Edge[],
  sizes?: Record<string, { width: number; height: number }>
) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: 'TB',
    nodesep: 100,
    ranksep: 50,
  })

  nodes.forEach((node) => {
    const size = sizes?.[node.id]
    dagreGraph.setNode(node.id, {
      width: size?.width ?? DEFAULT_NODE_WIDTH,
      height: size?.height ?? DEFAULT_NODE_HEIGHT,
    })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.targetPosition = Position.Top
    node.sourcePosition = Position.Bottom
    node.position = {
      x: nodeWithPosition.x - (sizes?.[node.id]?.width ?? DEFAULT_NODE_WIDTH) / 2,
      y: nodeWithPosition.y - (sizes?.[node.id]?.height ?? DEFAULT_NODE_HEIGHT) / 2,
    }
  })

  return { nodes, edges }
}
