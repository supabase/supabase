import { useCallback, useEffect, useMemo } from 'react'
import {
  applyNodeChanges,
  Background,
  BackgroundVariant,
  Edge,
  Node,
  NodeChange,
  NodeProps,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from 'reactflow'

import { TableNode, TableNodeData } from '../Database/Schemas/SchemaTableNode'

export const TABLE_NODE_WIDTH = 640
export const TABLE_NODE_ROW_HEIGHT = 80

interface SchemaFlowProps {
  nodes: Node[]
  edges: Edge[]
}

export const SchemaFlow = ({ nodes: initialNodes, edges: initialEdges }: SchemaFlowProps) => {
  const [nodes, setNodes] = useNodesState(initialNodes)
  const [edges, setEdges] = useEdgesState(initialEdges)
  const nodeTypes = useMemo(
    () => ({ table: (props: NodeProps<TableNodeData>) => <TableNode {...props} placeholder /> }),
    []
  )
  const reactFlowInstance = useReactFlow<TableNodeData>()

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  useEffect(() => {
    reactFlowInstance.fitView()
  }, [reactFlowInstance, nodes, edges])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => applyNodeChanges(changes, nds))
    },
    [setNodes]
  )

  return (
    <div
      style={{ maskImage: 'linear-gradient(to right, transparent 2%, black 13%)' }}
      className="absolute inset-0"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        defaultEdgeOptions={{
          type: 'smoothstep',
          animated: true,
          deletable: false,
          style: {
            stroke: 'hsl(var(--border-stronger))',
            strokeWidth: 0.5,
          },
        }}
        fitView
        minZoom={0.8}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
        panOnScroll
        panOnScrollSpeed={1}
      >
        <Background
          gap={16}
          className="[&>*]:stroke-foreground-muted opacity-[50%]"
          variant={BackgroundVariant.Dots}
          color={'inherit'}
        />
      </ReactFlow>
    </div>
  )
}
