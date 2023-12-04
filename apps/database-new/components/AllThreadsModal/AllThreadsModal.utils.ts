// import { UserMessage } from '@/lib/types'
// import dagre from '@dagrejs/dagre'
// import { Edge, Node, Position } from 'reactflow'
// import { NODE_HEIGHT, NODE_WIDTH } from './AllThreadsModal.constants'
// import { MessageNodeData } from './MessageNode'

// export const getGraphDataFromMessages = ({
//   messages,
//   onSelectMessage,
// }: {
//   messages: UserMessage[]
//   onSelectMessage: (message: UserMessage) => void
// }): { nodes: Node<MessageNodeData>[]; edges: Edge[] } => {
//   const nodes: Node[] = messages.map((message, idx) => {
//     return {
//       id: message.id,
//       type: 'message',
//       data: {
//         id: message.id,
//         text: message.text,
//         isStart: idx === 0,
//         isEnd: idx === messages.length - 1,
//         onSelectMessage: () => onSelectMessage(message),
//       },
//       position: { x: 0, y: 0 },
//     }
//   })

//   const edges: Edge[] = []
//   messages.forEach((message, idx) => {
//     if (idx > 0) {
//       edges.push({
//         id: `edge-${idx}`,
//         source: messages[idx - 1].id,
//         target: message.id,
//         type: 'smoothstep',
//         animated: true,
//       })
//     }
//   })

//   const dagreGraph = new dagre.graphlib.Graph()
//   dagreGraph.setDefaultEdgeLabel(() => ({}))
//   dagreGraph.setGraph({ rankdir: 'TB', ranksep: 50, nodesep: 20 })

//   nodes.forEach((node) =>
//     dagreGraph.setNode(node.id, { width: NODE_WIDTH / 2, height: NODE_HEIGHT / 2 })
//   )
//   edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target))
//   dagre.layout(dagreGraph)

//   nodes.forEach((node) => {
//     const nodeWithPosition = dagreGraph.node(node.id)
//     node.targetPosition = Position.Top
//     node.sourcePosition = Position.Bottom
//     node.position = {
//       x: nodeWithPosition.x - nodeWithPosition.width / 2,
//       y: nodeWithPosition.y - nodeWithPosition.height / 2,
//     }

//     return node
//   })

//   return { nodes, edges }
// }
