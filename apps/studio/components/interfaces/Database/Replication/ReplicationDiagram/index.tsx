import { useTheme } from 'next-themes'
import { useEffect, useMemo } from 'react'
import ReactFlow, { Background, ReactFlowProvider, useReactFlow } from 'reactflow'

import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useReplicationDestinationsQuery } from '@/data/replication/destinations-query'
import { useParams } from 'common'
import { SmoothstepEdge } from './Edge'
import { PrimaryDatabaseNode, ReadReplicaNode, ReplicationNode } from './Nodes'
import { getDagreGraphLayout } from './ReplicationDiagram.utils'

export const ReplicationDiagram = () => {
  return (
    <ReactFlowProvider>
      <ReplicationDiagramContent />
    </ReactFlowProvider>
  )
}

const ReplicationDiagramContent = () => {
  const { ref: projectRef = 'default' } = useParams()
  const { resolvedTheme } = useTheme()
  const reactFlow = useReactFlow()

  const { data: databases = [], isSuccess: isSuccessReplicas } = useReadReplicasQuery({
    projectRef,
  })
  const readReplicas = databases.filter((x) => x.identifier !== projectRef)

  const { data, isSuccess: isSuccessDestinations } = useReplicationDestinationsQuery({
    projectRef,
  })
  const destinations = data?.destinations ?? []

  const isDataLoaded = isSuccessReplicas && isSuccessDestinations

  const nodes = useMemo(
    () => [
      { id: projectRef, type: 'primary', data: {}, position: { x: 0, y: 5 } },
      ...(isDataLoaded
        ? [
            ...readReplicas.map((x) => ({
              id: x.identifier,
              type: 'readReplica',
              data: {},
              position: { x: 0, y: 0 },
            })),
            // ...destinations.map((x) => ({
            //   id: x.id.toString(),
            //   type: 'replication',
            //   data: {},
            //   position: { x: 0, y: 0 },
            // })),
          ]
        : []),
    ],
    [isDataLoaded]
  )
  const edges = useMemo(
    () =>
      isDataLoaded
        ? [
            ...readReplicas.map((x) => ({
              id: `${projectRef}-${x.identifier}`,
              source: projectRef,
              target: x.identifier,
              type: 'smoothstep',
              animated: true,
              className: '!cursor-default',
            })),
            ...destinations.map((x) => ({
              id: `${projectRef}-${x.id}`,
              source: projectRef,
              target: x.id.toString(),
              type: 'smoothstep',
              animated: true,
              className: '!cursor-default',
            })),
          ]
        : [],
    [isDataLoaded]
  )

  const nodeTypes = useMemo(
    () => ({
      primary: PrimaryDatabaseNode,
      replication: ReplicationNode,
      readReplica: ReadReplicaNode,
    }),
    []
  )
  const edgeTypes = useMemo(() => ({ smoothstep: SmoothstepEdge }), [])

  const backgroundPatternColor =
    resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)'

  const setReactFlow = async () => {
    const graph = getDagreGraphLayout(nodes, edges)
    reactFlow.setNodes(graph.nodes)
    reactFlow.setEdges(graph.edges)

    console.log(graph.nodes)

    // [Joshen] Odd fix to ensure that react flow snaps back to center when adding nodes
    reactFlow.fitView({ maxZoom: 0.9, minZoom: 0.9 })
  }

  useEffect(() => {
    if (isDataLoaded) setReactFlow()
  }, [isDataLoaded])

  return (
    <div className="nowheel relative min-h-[300px]">
      <ReactFlow
        fitView
        fitViewOptions={{ minZoom: 0.9, maxZoom: 0.9 }}
        className="bg"
        zoomOnPinch={false}
        zoomOnScroll={false}
        nodesDraggable={false}
        nodesConnectable={false}
        zoomOnDoubleClick={false}
        edgesFocusable={false}
        edgesUpdatable={false}
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
