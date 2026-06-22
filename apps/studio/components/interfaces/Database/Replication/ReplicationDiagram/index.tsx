import { Background, ColorMode, ReactFlow, ReactFlowProvider, useReactFlow } from '@xyflow/react'
import { useParams } from 'common'
import { useTheme } from 'next-themes'
import { useEffect, useMemo } from 'react'

import { PrimaryDatabaseNode, ReadReplicaNode, ReplicationNode } from './Nodes'
import { getDagreGraphLayout } from './ReplicationDiagram.utils'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useReplicationDestinationsQuery } from '@/data/replication/destinations-query'
import { timeout } from '@/lib/helpers'

import '@xyflow/react/dist/style.css'

import { SmoothstepEdge } from './Edges'
import { checkLocalETLNotSetUp } from '@/data/replication/utils'

export const ReplicationDiagram = () => {
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
  const reactFlow = useReactFlow()
  const { resolvedTheme } = useTheme()
  const { ref: projectRef = 'default' } = useParams()

  const { data: databases = [], isSuccess: isSuccessReplicas } = useReadReplicasQuery({
    projectRef,
  })
  const readReplicas = useMemo(
    () => databases.filter((x) => x.identifier !== projectRef),
    [databases, projectRef]
  )

  const {
    data,
    error: destinationsError,
    isSuccess: isSuccessDestinations,
    isError: isErrorDestinations,
  } = useReplicationDestinationsQuery({
    projectRef,
  })
  const destinations = useMemo(() => data?.destinations ?? [], [data])
  const isLocalETLNotSetUp = checkLocalETLNotSetUp(destinationsError)
  const skipRenderingDestinations = isErrorDestinations && isLocalETLNotSetUp

  const nodes = useMemo(() => {
    return [
      { id: projectRef, type: 'primary', data: {}, position: { x: 0, y: 5 } },
      ...readReplicas.map((x) => ({
        id: x.identifier,
        type: 'readReplica',
        data: {},
        position: { x: 0, y: 0 },
      })),
      ...destinations.map((x) => ({
        id: x.id.toString(),
        type: 'replication',
        data: {},
        position: { x: 0, y: 0 },
      })),
    ]
  }, [destinations, projectRef, readReplicas])

  const edges = useMemo(() => {
    const shiftEdgeEnd = readReplicas.length + destinations.length > 1

    return [
      ...readReplicas.map((x) => ({
        id: `${projectRef}-${x.identifier}`,
        source: projectRef,
        target: x.identifier,
        type: 'smoothstep',
        className: 'cursor-default!',
        // The edge subscribes to live status itself (see Edges.tsx) so it stays in sync with nodes.
        data: { type: 'replica', identifier: x.identifier, shiftEdgeEnd },
      })),
      ...destinations.map((x) => ({
        id: `${projectRef}-${x.id}`,
        source: projectRef,
        target: x.id.toString(),
        type: 'smoothstep',
        className: 'cursor-default!',
        data: { type: 'etl', identifier: x.id.toString(), shiftEdgeEnd },
      })),
    ]
  }, [destinations, projectRef, readReplicas])

  const backgroundPatternColor =
    resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)'

  const setReactFlow = async () => {
    const graph = getDagreGraphLayout(nodes, edges)
    reactFlow.setNodes(graph.nodes)
    reactFlow.setEdges(graph.edges)

    // [Joshen] Odd fix to ensure that react flow snaps back to center when adding nodes
    await timeout(1)
    reactFlow.fitView({ minZoom: 0.8, maxZoom: 0.9 })
  }

  useEffect(() => {
    if (
      nodes.length > 0 &&
      (isSuccessDestinations || skipRenderingDestinations) &&
      isSuccessReplicas
    ) {
      setReactFlow()
    }
  }, [nodes, isSuccessDestinations, skipRenderingDestinations, isSuccessReplicas])

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
