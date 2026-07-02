'use client'

import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { memo, useMemo, useRef } from 'react'

import { RealtimeFlowOverlay } from '../blocks/realtime-flow/components/realtime-flow-overlay'
import { useRealtimeFlow } from '../blocks/realtime-flow/hooks/use-realtime-flow'
import { Button } from '../components/ui/button'

const NODE_Y_BASE = 80
const NODE_X_BASE = 80
const FLOW_NODE_STYLE = {
  backgroundColor: 'hsl(var(--card))',
  borderColor: 'hsl(var(--border))',
  color: 'hsl(var(--card-foreground))',
}

type EditableNodeData = {
  label: string
  onLabelChange?: (value: string) => void
  onRemove?: () => void
}

const EditableNode = memo(({ data }: NodeProps<Node<EditableNodeData>>) => {
  return (
    <div className="min-w-56 rounded-xl border border-border bg-card p-3 text-card-foreground shadow-sm">
      <Handle type="target" position={Position.Top} />
      <div className="space-y-3">
        <input
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          value={data.label}
          onChange={(event) => data.onLabelChange?.(event.target.value)}
          placeholder="Write something..."
        />
        <div className="flex justify-end">
          <Button type="button" size="sm" variant="secondary" onClick={() => data.onRemove?.()}>
            Remove
          </Button>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  )
})

EditableNode.displayName = 'EditableNode'

const nodeTypes = {
  editable: EditableNode,
}

const INITIAL_NODES: Node[] = [
  {
    id: 'node-1',
    type: 'editable',
    position: { x: 100, y: 100 },
    data: { label: 'Node 1' },
    style: FLOW_NODE_STYLE,
  },
  {
    id: 'node-2',
    type: 'editable',
    position: { x: 100, y: 300 },
    data: { label: 'Node 2' },
    style: FLOW_NODE_STYLE,
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
  const nextNodeIndexRef = useRef(3)
  const {
    nodes,
    edges,
    synced,
    syncError,
    onNodesChange,
    onEdgesChange,
    onConnect,
    setNodes,
    setEdges,
  } = useRealtimeFlow({
    channel: 'realtime-flow-demo',
    initialNodes: INITIAL_NODES,
    initialEdges: INITIAL_EDGES,
  })

  const displayNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        type: 'editable',
        data: {
          ...(node.data as EditableNodeData),
          onLabelChange: (value: string) => {
            setNodes((prev) =>
              prev.map((n) =>
                n.id === node.id
                  ? { ...n, data: { ...(n.data as EditableNodeData), label: value } }
                  : n
              )
            )
          },
          onRemove: () => {
            setNodes((prev) => prev.filter((n) => n.id !== node.id))
            setEdges((prev) => prev.filter((e) => e.source !== node.id && e.target !== node.id))
          },
        },
      })),
    [nodes, setNodes, setEdges]
  )

  return (
    <ReactFlowProvider>
      <div className="p-4 space-y-4">
        <div className="flex justify-end">
          <Button
            disabled={!synced}
            onClick={() => {
              const nodeNumber = nextNodeIndexRef.current
              const node: Node = {
                id: crypto.randomUUID(),
                type: 'editable',
                position: {
                  x: NODE_X_BASE,
                  y: NODE_Y_BASE * nodeNumber,
                },
                data: {
                  label: `Node ${nodeNumber}`,
                },
                style: FLOW_NODE_STYLE,
              }

              setNodes((prev) => [...prev, node])
              nextNodeIndexRef.current += 1
            }}
          >
            Add node
          </Button>
        </div>
        <div className="relative h-[550px]">
          <ReactFlow
            nodes={synced ? displayNodes : []}
            edges={synced ? edges : []}
            onNodesChange={synced ? onNodesChange : undefined}
            onEdgesChange={synced ? onEdgesChange : undefined}
            onConnect={synced ? onConnect : undefined}
            nodeTypes={nodeTypes}
            fitView
          >
            <Background />
            <Controls />
          </ReactFlow>
          {!synced && !syncError && <RealtimeFlowOverlay status="syncing" />}
          {!synced && syncError && <RealtimeFlowOverlay status="error" message={syncError} />}
        </div>
      </div>
    </ReactFlowProvider>
  )
}

export default RealtimeFlowDemo
