import { Background, ColorMode, ReactFlow, ReactFlowProvider } from '@xyflow/react'
import { useTheme } from 'next-themes'

import { PrimaryDatabaseNode, ReadReplicaNode, ReplicationNode } from './Nodes'

import '@xyflow/react/dist/style.css'

import { SmoothstepEdge } from './Edges'

export const EmptyReplicationDiagram = () => {
  return (
    <ReactFlowProvider>
      <ReplicationDiagramContent />
    </ReactFlowProvider>
  )
}

const nodeTypes = {
  primary: PrimaryDatabaseNode,
  replication: ReplicationNode,
  readReplica: ReadReplicaNode,
}

const edgeTypes = { smoothstep: SmoothstepEdge }

const ReplicationDiagramContent = () => {
  const { resolvedTheme } = useTheme()

  const backgroundPatternColor =
    resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)'

  return (
    <div className="nowheel relative min-h-[350px]">
      <ReactFlow
        // FIXME: https://github.com/xyflow/xyflow/issues/4876
        colorMode={'' as unknown as ColorMode}
        fitView
        fitViewOptions={{ minZoom: 0.8, maxZoom: 0.9 }}
        className="bg"
        zoomOnPinch={false}
        zoomOnScroll={false}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnDoubleClick={false}
        edgesFocusable={false}
        edgesReconnectable={false}
        defaultNodes={[]}
        defaultEdges={[]}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        proOptions={{ hideAttribution: true }}
      >
        <Background color={backgroundPatternColor} />
      </ReactFlow>
    </div>
  )
}
