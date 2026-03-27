'use client'

import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { SupabasePersistenceOptions } from '@supabase-labs/y-supabase'

import { useRealtimeFlow } from '../hooks/use-realtime-flow'

type RealtimeFlowProps = {
  channel: string
  className?: string
  style?: React.CSSProperties
  persistence?: boolean | SupabasePersistenceOptions
  initialNodes?: Node[]
  initialEdges?: Edge[]
  nodeTypes?: NodeTypes
  edgeTypes?: EdgeTypes
  height?: string | number
}

const DEFAULT_HEIGHT = 550

const RealtimeFlowContent = ({
  channel,
  className,
  style,
  persistence,
  initialNodes,
  initialEdges,
  nodeTypes,
  edgeTypes,
  height = DEFAULT_HEIGHT,
}: RealtimeFlowProps) => {
  const { nodes, edges, synced, onNodesChange, onEdgesChange, onConnect } = useRealtimeFlow({
    channel,
    persistence,
    initialNodes,
    initialEdges,
  })

  return (
    <div style={{ height, position: 'relative', ...style }} className={className}>
      <ReactFlow
        nodes={synced ? nodes : []}
        edges={synced ? edges : []}
        onNodesChange={synced ? onNodesChange : undefined}
        onEdgesChange={synced ? onEdgesChange : undefined}
        onConnect={synced ? onConnect : undefined}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
      {!synced && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            backdropFilter: 'blur(2px)',
            zIndex: 10,
          }}
        >
          <span style={{ fontSize: 14, color: '#666' }}>Syncing…</span>
        </div>
      )}
    </div>
  )
}

const RealtimeFlow = (props: RealtimeFlowProps) => (
  <ReactFlowProvider>
    <RealtimeFlowContent {...props} />
  </ReactFlowProvider>
)

export { RealtimeFlow }
