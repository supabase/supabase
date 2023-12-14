// import { Handle, NodeProps, Position } from 'reactflow'
// import { NODE_HEIGHT, NODE_WIDTH } from './AllThreadsModal.constants'

// export interface MessageNodeData {
//   id: string
//   text: string
//   isStart: boolean
//   isEnd: boolean
//   onSelectMessage: () => void
// }

// const MessageNode = ({ data }: NodeProps<MessageNodeData>) => {
//   const { id, text, isStart, isEnd, onSelectMessage } = data
//   return (
//     <>
//       {!isStart && (
//         <Handle
//           type="target"
//           id="handle-t"
//           position={Position.Top}
//           style={{ background: 'transparent' }}
//         />
//       )}
//       <div
//         className="flex flex-col gap-y-1 rounded bg-surface-100 border border-default p-3 hover:bg-surface-200 transition cursor-pointer"
//         style={{ width: NODE_WIDTH / 2 - 10, height: NODE_HEIGHT / 2 }}
//         onClick={() => onSelectMessage()}
//       >
//         <p className="text-xs text-foreground-light font-mono">{id}</p>
//         <p className="text-sm">{text}</p>
//       </div>
//       {!isEnd && (
//         <Handle
//           type="source"
//           id="handle-s"
//           position={Position.Bottom}
//           style={{ background: 'transparent' }}
//         />
//       )}
//     </>
//   )
// }

// export default MessageNode
