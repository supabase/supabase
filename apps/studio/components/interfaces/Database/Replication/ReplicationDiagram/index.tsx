import { useQueryClient } from '@tanstack/react-query'
import { useTheme } from 'next-themes'
import { useEffect, useMemo } from 'react'
import ReactFlow, { Background, ReactFlowProvider, useReactFlow } from 'reactflow'

import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useReplicationDestinationsQuery } from '@/data/replication/destinations-query'
import { replicationKeys } from '@/data/replication/keys'
import { ReplicationPipelineStatusResponse } from '@/data/replication/pipeline-status-query'
import { useReplicationPipelinesQuery } from '@/data/replication/pipelines-query'
import { timeout } from '@/lib/helpers'
import { useParams } from 'common'
import { getStatusName } from '../Pipeline.utils'
import { PrimaryDatabaseNode, ReadReplicaNode, ReplicationNode } from './Nodes'
import { getDagreGraphLayout } from './ReplicationDiagram.utils'

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

const ReplicationDiagramContent = () => {
  const reactFlow = useReactFlow()
  const { resolvedTheme } = useTheme()
  const queryClient = useQueryClient()
  const { ref: projectRef = 'default' } = useParams()

  const { data: databases = [], isSuccess: isSuccessReplicas } = useReadReplicasQuery({
    projectRef,
  })
  const readReplicas = databases.filter((x) => x.identifier !== projectRef)

  const { data, isSuccess: isSuccessDestinations } = useReplicationDestinationsQuery({
    projectRef,
  })
  const destinations = useMemo(() => data?.destinations ?? [], [data])

  const { data: pipelinesData } = useReplicationPipelinesQuery({ projectRef })

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
    return [
      ...readReplicas.map((x) => {
        const isReplicating = x.status === 'ACTIVE_HEALTHY'

        return {
          id: `${projectRef}-${x.identifier}`,
          source: projectRef,
          target: x.identifier,
          type: 'smoothstep',
          className: '!cursor-default',
          animated: isReplicating,
          style: {
            opacity: isReplicating ? 1 : 0.4,
            strokeDasharray: isReplicating ? undefined : '5 5',
          },
        }
      }),
      ...destinations.map((x) => {
        const pipeline = (pipelinesData?.pipelines ?? []).find((p) => p.destination_id === x.id)
        const pipelineStatus = queryClient.getQueryData(
          replicationKeys.pipelinesStatus(projectRef, pipeline?.id)
        ) as ReplicationPipelineStatusResponse
        const statusName = getStatusName(pipelineStatus?.status)
        const isReplicating = statusName === 'started'

        return {
          id: `${projectRef}-${x.id}`,
          source: projectRef,
          target: x.id.toString(),
          type: 'smoothstep',
          className: '!cursor-default',
          animated: isReplicating,
          style: {
            opacity: isReplicating ? 1 : 0.4,
            strokeDasharray: isReplicating ? undefined : '5 5',
          },
        }
      }),
    ]
  }, [destinations, pipelinesData?.pipelines, projectRef, queryClient, readReplicas])

  const backgroundPatternColor =
    resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)'

  const setReactFlow = async () => {
    const graph = getDagreGraphLayout(nodes, edges)
    reactFlow.setNodes(graph.nodes)
    reactFlow.setEdges(graph.edges)

    // [Joshen] Odd fix to ensure that react flow snaps back to center when adding nodes
    await timeout(1)
    reactFlow.fitView({ maxZoom: 0.9, minZoom: 0.9 })
  }

  useEffect(() => {
    if (nodes.length > 0 && isSuccessDestinations && isSuccessReplicas) setReactFlow()
  }, [nodes, isSuccessDestinations, isSuccessReplicas])

  return (
    <div className="nowheel relative min-h-[350px]">
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
        proOptions={{ hideAttribution: true }}
      >
        <Background color={backgroundPatternColor} />
      </ReactFlow>
    </div>
  )
}
