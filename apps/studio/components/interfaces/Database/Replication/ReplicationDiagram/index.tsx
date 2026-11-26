import '@xyflow/react/dist/style.css'

import { useQueries, type UseQueryResult } from '@tanstack/react-query'
import { Background, ColorMode, ReactFlow, ReactFlowProvider, useReactFlow } from '@xyflow/react'
import { useParams } from 'common'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useMemo } from 'react'

import { SmoothstepEdge } from './Edges'
import { PrimaryDatabaseNode, ReplicationNode } from './Nodes'
import { getDagreGraphLayout } from './ReplicationDiagram.utils'
import { useReplicationClusters } from '@/components/interfaces/Database/Replication/useReplicationClusters'
import {
  replicationDestinationsQueryOptions,
  type ReplicationDestinationsData,
} from '@/data/replication/destinations-query'
import { checkLocalPipelinesNotSetUp } from '@/data/replication/utils'
import type { StudioError } from '@/lib/errors/studio-errors'

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
}

const edgeTypes = { smoothstep: SmoothstepEdge }

const ReplicationDiagramContent = () => {
  const reactFlow = useReactFlow()
  const { resolvedTheme } = useTheme()
  const { ref: projectRef = 'default' } = useParams()

  const { clusters } = useReplicationClusters()
  const groups = clusters.map((cluster) => ({
    clusterId: cluster.isDefault ? undefined : cluster.clusterId,
    region:
      cluster.regionName === undefined
        ? undefined
        : {
            cluster_id: cluster.clusterId ?? '',
            region_name: cluster.regionName,
            region_code: cluster.regionCode,
          },
  }))
  const combineDestinations = useCallback(
    (results: UseQueryResult<ReplicationDestinationsData, StudioError>[]) => ({
      destinations: results.flatMap((result, index) => {
        const { clusterId, region } = groups[index]
        return (result.data?.destinations ?? []).map((destination) => ({
          nodeId: JSON.stringify([clusterId ?? null, destination.id]),
          destination,
          clusterId,
          region,
        }))
      }),
      canRenderGraph: results.some(
        (result) => result.data !== undefined || checkLocalPipelinesNotSetUp(result.error)
      ),
    }),
    [groups]
  )
  const { destinations, canRenderGraph } = useQueries({
    queries: groups.map(({ clusterId }) =>
      replicationDestinationsQueryOptions({ projectRef, clusterId })
    ),
    combine: combineDestinations,
  })

  const nodes = useMemo(() => {
    return [
      {
        id: projectRef,
        type: 'primary',
        data: { hasDestinations: destinations.length > 0 },
        position: { x: 0, y: 5 },
      },
      ...destinations.map(({ nodeId, destination, clusterId }) => ({
        id: nodeId,
        type: 'replication',
        data: { destination, clusterId },
        position: { x: 0, y: 0 },
      })),
    ]
  }, [destinations, projectRef])

  const edges = useMemo(() => {
    const shiftEdgeEnd = destinations.length > 1

    return destinations.map(({ nodeId, destination, clusterId, region }) => ({
      id: `${projectRef}-${nodeId}`,
      source: projectRef,
      target: nodeId,
      type: 'smoothstep',
      className: 'cursor-default!',
      data: { destinationId: destination.id, clusterId, region, shiftEdgeEnd },
    }))
  }, [destinations, projectRef])

  const backgroundPatternColor =
    resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)'

  useEffect(() => {
    if (!canRenderGraph) return

    const graph = getDagreGraphLayout(nodes, edges)
    reactFlow.setNodes(graph.nodes)
    reactFlow.setEdges(graph.edges)

    // Fit the graph after React Flow has added the new nodes.
    const timer = setTimeout(() => reactFlow.fitView({ minZoom: 0.8, maxZoom: 0.9 }), 1)
    return () => clearTimeout(timer)
  }, [canRenderGraph, edges, nodes, reactFlow])

  return (
    <div className="nowheel relative h-[350px] w-full border border-muted rounded-md overflow-hidden">
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
