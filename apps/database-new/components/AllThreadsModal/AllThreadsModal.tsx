// 'use client'

// import { useQuery } from '@tanstack/react-query'
// import { Modal } from 'ui'
// import { useParams } from 'next/navigation'
// import { AssistantMessage, ReadThreadAPIResult, UserMessage } from '@/lib/types'
// import { useEffect, useMemo } from 'react'
// import { sortBy } from 'lodash'
// import ReactFlow, {
//   Background,
//   BackgroundVariant,
//   ReactFlowProvider,
//   useReactFlow,
//   MiniMap,
// } from 'reactflow'
// import { getGraphDataFromMessages } from './AllThreadsModal.utils'
// import MessageNode from './MessageNode'

// interface AllThreadsProps {
//   visible: boolean
//   onClose: () => void
//   onSelectMessage: (messageId: string, replyId: string) => void
// }

// // [Joshen] POC idea for forking/branching - not for phase 1

// const AllThreads = ({ visible, onClose, onSelectMessage }: AllThreadsProps) => {
//   const params = useParams()
//   const reactFlowInstance = useReactFlow()
//   const nodeTypes = useMemo(() => ({ message: MessageNode }), [])

//   // [Joshen] Scaffolding a query cause im presuming we need a different endpoint to retrieve _all_ threads
//   const { data, isSuccess } = useQuery<ReadThreadAPIResult>({
//     queryFn: async () => {
//       const response = await fetch(`/api/ai/sql/threads/${params.threadId}/read/${params.runId}`, {
//         method: 'GET',
//       })

//       const result = await response.json()
//       return result
//     },
//     queryKey: [params.threadId, params.runId],
//     refetchInterval: (options) => {
//       const data = options.state.data
//       if (data && data.status === 'completed') {
//         return Infinity
//       }
//       return 5000
//     },
//     enabled: !!(params.threadId && params.runId),
//   })

//   const messages = useMemo(() => {
//     if (isSuccess) return sortBy(data.messages, (m) => m.created_at)
//     return []
//   }, [data?.messages, isSuccess])

//   const userMessages = messages.filter((m) => m.role === 'user') as UserMessage[]

//   useEffect(() => {
//     if (reactFlowInstance !== undefined && userMessages.length > 0) {
//       const { nodes, edges } = getGraphDataFromMessages({
//         messages: userMessages,
//         onSelectMessage: (message: UserMessage) => {
//           const index = messages.indexOf(message)
//           const reply = messages[index + 1] as AssistantMessage
//           onSelectMessage(message.id, reply.id)
//         },
//       })
//       reactFlowInstance.setNodes(nodes)
//       reactFlowInstance.setEdges(edges)
//       setTimeout(() => {
//         reactFlowInstance.fitView({})
//         const viewport = reactFlowInstance.getViewport()
//         reactFlowInstance.setViewport({ x: viewport.x - 70, y: 150, zoom: 1 })
//       })
//     }
//   }, [reactFlowInstance, userMessages, messages, onSelectMessage])

//   useEffect(() => {
//     if (reactFlowInstance !== undefined && visible) {
//       reactFlowInstance.fitView({})
//     }
//   }, [reactFlowInstance, visible])

//   return (
//     <Modal
//       showCloseButton
//       hideFooter
//       size="xxlarge"
//       visible={visible}
//       onCancel={onClose}
//       header="All threads in current conversation"
//     >
//       <div className="h-[700px] border-t bg-background">
//         <ReactFlow
//           nodesDraggable={false}
//           edgesUpdatable={false}
//           defaultNodes={[]}
//           defaultEdges={[]}
//           maxZoom={1.1}
//           nodeTypes={nodeTypes}
//           proOptions={{ hideAttribution: true }}
//         >
//           <Background gap={16} color="#000" variant={BackgroundVariant.Lines} />
//           <MiniMap
//             pannable
//             zoomable
//             nodeColor={'rgba(0,0,0,0.7)'}
//             maskColor={'rgba(0,0,0,0.85)'}
//             className="border border-control rounded-md shadow-sm"
//           />
//         </ReactFlow>
//       </div>
//     </Modal>
//   )
// }

// const AllThreadsModal = ({ visible, onClose, onSelectMessage }: AllThreadsProps) => {
//   return (
//     <ReactFlowProvider>
//       <AllThreads visible={visible} onClose={onClose} onSelectMessage={onSelectMessage} />
//     </ReactFlowProvider>
//   )
// }

// export default AllThreadsModal
