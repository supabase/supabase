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
import type { SupabasePersistenceOptions } from '@supabase-labs/y-supabase'

import { RealtimeFlowOverlay } from './realtime-flow-overlay'
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
  const { nodes, edges, synced, syncError, onNodesChange, onEdgesChange, onConnect } =
    useRealtimeFlow({
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
      {!synced && !syncError && <RealtimeFlowOverlay status="syncing" />}
      {!synced && syncError && <RealtimeFlowOverlay status="error" message={syncError} />}
    </div>
  )
}

const RealtimeFlow = (props: RealtimeFlowProps) => (
  <ReactFlowProvider>
    <RealtimeFlowContent {...props} />
  </ReactFlowProvider>
)

export { RealtimeFlow }
