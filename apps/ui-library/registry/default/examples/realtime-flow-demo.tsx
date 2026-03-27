'use client'

import { type Edge, type Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { RealtimeFlow } from '../blocks/realtime-flow/components/realtime-flow'

const INITIAL_NODES: Node[] = [
  {
    id: 'node-1',
    type: 'default',
    position: { x: 100, y: 100 },
    data: { label: 'Node 1' },
  },
  {
    id: 'node-2',
    type: 'default',
    position: { x: 100, y: 300 },
    data: { label: 'Node 2' },
  },
]

const INITIAL_EDGES: Edge[] = [
  {
    id: 'edge-1-2',
    source: 'node-1',
    target: 'node-2',
  },
]

const RealtimeFlowDemo = () => {
  return (
    <RealtimeFlow
      channel="realtime-flow-demo"
      initialNodes={INITIAL_NODES}
      initialEdges={INITIAL_EDGES}
    />
  )
}

export default RealtimeFlowDemo
