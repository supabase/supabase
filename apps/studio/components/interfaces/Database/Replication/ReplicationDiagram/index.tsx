import { useQueries } from '@tanstack/react-query'
import { Background, ColorMode, ReactFlow, ReactFlowProvider, useReactFlow } from '@xyflow/react'
import { useParams } from 'common'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useMemo } from 'react'

import { PrimaryDatabaseNode, ReplicationNode } from './Nodes'
import { getDagreGraphLayout } from './ReplicationDiagram.utils'
import { useReplicationClusterGroups } from '@/data/replication/clusters-query'
import {
  replicationDestinationsQueryOptions,
  type ReplicationDestinationsData,
} from '@/data/replication/destinations-query'
import type { StudioError } from '@/lib/errors/studio-errors'
import { timeout } from '@/lib/helpers'

import '@xyflow/react/dist/style.css'

import { SmoothstepEdge } from './Edges'
import { checkLocalPipelinesNotSetUp } from '@/data/replication/utils'

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

  const { groups } = useReplicationClusterGroups()
  const combineDestinations = useCallback(
    (
      results: {
        data?: ReplicationDestinationsData
        isPending: boolean
        isError: boolean
        error: StudioError | null
      }[]
    ) => ({
      destinations: results.flatMap((result, index) => {
        const { clusterId } = groups[index]
        return (result.data?.destinations ?? []).map((destination) => ({
          // Destination IDs are only unique within a cluster.
          nodeId: clusterId === undefined ? `${destination.id}` : `${clusterId}:${destination.id}`,
          destinationId: destination.id.toString(),
          clusterId,
        }))
      }),
      isSuccessDestinations: results.every((result) => !result.isPending),
      skipRenderingDestinations: results.some(
        (result) => result.isError && checkLocalPipelinesNotSetUp(result.error)
      ),
    }),
    [groups]
  )
  const { destinations, isSuccessDestinations, skipRenderingDestinations } = useQueries({
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
      ...destinations.map(({ nodeId, destinationId, clusterId }) => ({
        id: nodeId,
        type: 'replication',
        data: { destinationId, clusterId },
        position: { x: 0, y: 0 },
      })),
    ]
  }, [destinations, projectRef])

  const edges = useMemo(() => {
    const shiftEdgeEnd = destinations.length > 1

    return destinations.map(({ nodeId, destinationId, clusterId }) => ({
      id: `${projectRef}-${nodeId}`,
      source: projectRef,
      target: nodeId,
      type: 'smoothstep',
      className: 'cursor-default!',
      data: { identifier: destinationId, clusterId, shiftEdgeEnd },
    }))
  }, [destinations, projectRef])

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
    if (nodes.length > 0 && (isSuccessDestinations || skipRenderingDestinations)) {
      setReactFlow()
    }
  }, [nodes, isSuccessDestinations, skipRenderingDestinations])

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
