import dagre from '@dagrejs/dagre'
import { Edge, Node, Position } from 'reactflow'
import { NODE_ROW_HEIGHT, NODE_WIDTH } from './Infrastructure.constants'

export const getGraphLayout = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 100 })

  nodes.forEach((node) =>
    dagreGraph.setNode(node.id, { width: NODE_WIDTH / 2, height: NODE_ROW_HEIGHT / 2 })
  )

  edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target))

  dagre.layout(dagreGraph)

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.targetPosition = Position.Top
    node.sourcePosition = Position.Bottom
    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWithPosition.width / 2,
      y: nodeWithPosition.y - nodeWithPosition.height / 2,
    }

    return node
  })

  return { nodes, edges }
}
