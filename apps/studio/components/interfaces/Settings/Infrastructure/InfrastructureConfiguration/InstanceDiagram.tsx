import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { partition } from 'lodash'
import { Loader2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, { Background, Edge, ReactFlowProvider, useReactFlow } from 'reactflow'
import 'reactflow/dist/style.css' // Ensure styles are imported

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { useLoadBalancersQuery } from 'data/read-replicas/load-balancers-query'
import { Database, useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import {
  ReplicaInitializationStatus,
  useReadReplicasStatusesQuery,
} from 'data/read-replicas/replicas-status-query'
import { timeout } from 'lib/helpers'
import { addRegionNodes, generateNodes, getDagreGraphLayout } from './InstanceConfiguration.utils' // Assuming these utils are correctly located or moved
import { SmoothstepEdge } from './Edge'
import { REPLICA_STATUS } from './InstanceConfiguration.constants'
import { LoadBalancerNode, PrimaryNode, RegionNode, ReplicaNode } from './InstanceNode'

// Define props if needed, for now, keeping it self-contained
interface InstanceDiagramProps {
  height?: number // Add height prop
}

const InstanceDiagramUI = ({ height }: InstanceDiagramProps) => {
  const reactFlow = useReactFlow()
  const { resolvedTheme } = useTheme()
  const { ref: projectRef } = useParams()
  const numTransition = useRef<number>()
  const { project, isLoading: isLoadingProject } = useProjectContext()

  // State for refetching, may need adjustment based on context
  const [refetchInterval, setRefetchInterval] = useState<number | boolean>(10000)

  const {
    data: loadBalancers,
    refetch: refetchLoadBalancers,
    isSuccess: isSuccessLoadBalancers,
  } = useLoadBalancersQuery({
    projectRef,
  })
  const {
    data,
    error,
    refetch: refetchReplicas,
    isLoading,
    isError,
    isSuccess: isSuccessReplicas,
  } = useReadReplicasQuery({
    projectRef,
  })
  const [[primary], replicas] = useMemo(
    () => partition(data ?? [], (db) => db.identifier === projectRef),
    [data, projectRef]
  )

  // Replica status query - might need adjustments if interaction logic is removed
  useReadReplicasStatusesQuery(
    { projectRef },
    {
      refetchInterval: refetchInterval as any,
      refetchOnWindowFocus: false,
      onSuccess: async (res) => {
        const fixedStatues = [
          REPLICA_STATUS.ACTIVE_HEALTHY,
          REPLICA_STATUS.ACTIVE_UNHEALTHY,
          REPLICA_STATUS.INIT_READ_REPLICA_FAILED,
        ]
        const replicasInTransition = res.filter((db) => {
          const { status } = db.replicaInitializationStatus || {}
          return (
            !fixedStatues.includes(db.status) || status === ReplicaInitializationStatus.InProgress
          )
        })
        const hasTransientStatus = replicasInTransition.length > 0

        if (
          numTransition.current !== replicasInTransition.length ||
          res.length !== (data ?? []).length
        ) {
          numTransition.current = replicasInTransition.length
          await refetchReplicas()
          setTimeout(() => refetchLoadBalancers(), 2000)
        }

        if (!hasTransientStatus) {
          setRefetchInterval(false)
        }
      },
    }
  )

  const backgroundPatternColor =
    resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)'

  const nodes = useMemo(
    () =>
      isSuccessReplicas && isSuccessLoadBalancers && primary !== undefined
        ? // Pass empty handlers as we don't want interaction in this standalone diagram
          generateNodes({
            primary,
            replicas,
            loadBalancers: loadBalancers ?? [],
            onSelectRestartReplica: () => {},
            onSelectDropReplica: () => {},
          })
        : [],
    [isSuccessReplicas, isSuccessLoadBalancers, primary, replicas, loadBalancers]
  )

  const edges: Edge[] = useMemo(
    () =>
      isSuccessReplicas && isSuccessLoadBalancers && primary
        ? [
            ...((loadBalancers ?? []).length > 0
              ? [
                  {
                    id: `load-balancer-${primary.identifier}`,
                    source: 'load-balancer',
                    target: primary.identifier,
                    type: 'smoothstep',
                    animated: true,
                    className: '!cursor-default',
                  },
                ]
              : []),
            ...replicas.map((database) => {
              return {
                id: `${primary.identifier}-${database.identifier}`,
                source: primary.identifier,
                target: database.identifier,
                type: 'smoothstep',
                animated: true,
                className: '!cursor-default',
                data: {
                  status: database.status,
                  identifier: database.identifier,
                  connectionString: database.connectionString,
                },
              }
            }),
          ]
        : [],
    [isSuccessLoadBalancers, isSuccessReplicas, loadBalancers, primary?.identifier, replicas]
  )

  const nodeTypes = useMemo(
    () => ({
      PRIMARY: PrimaryNode,
      READ_REPLICA: ReplicaNode,
      REGION: RegionNode,
      LOAD_BALANCER: LoadBalancerNode,
    }),
    []
  )

  const edgeTypes = useMemo(
    () => ({
      smoothstep: SmoothstepEdge,
    }),
    []
  )

  const setReactFlow = async () => {
    if (nodes.length === 0) return // Avoid errors if nodes aren't ready

    const graph = getDagreGraphLayout(nodes, edges)
    const { nodes: updatedNodes } = addRegionNodes(graph.nodes, graph.edges)
    reactFlow.setNodes(updatedNodes)
    reactFlow.setEdges(graph.edges)

    await timeout(1)
    reactFlow.fitView({ maxZoom: 0.9, minZoom: 0.9 })
  }

  useEffect(() => {
    if (isSuccessReplicas && isSuccessLoadBalancers && nodes.length > 0) {
      setReactFlow()
    }
    // Dependency array might need refinement depending on interaction/updates
  }, [isSuccessReplicas, isSuccessLoadBalancers, nodes, edges])

  return (
    <div
      className={`${height ? `h-[${height}px]` : 'h-full'} w-full relative ${
        isSuccessReplicas && !isLoadingProject ? '' : 'flex items-center justify-center px-28'
      }`}
    >
      {(isLoading || isLoadingProject) && (
        <Loader2 className="animate-spin text-foreground-light" />
      )}
      {isError && <AlertError error={error} subject="Failed to retrieve diagram data" />}
      {isSuccessReplicas && !isLoadingProject && primary && (
        <ReactFlow
          fitView
          fitViewOptions={{ minZoom: 0.9, maxZoom: 0.9 }}
          className="instance-configuration" // Consider renaming or adjusting styles
          zoomOnPinch={false}
          zoomOnScroll={false}
          nodesDraggable={false}
          nodesConnectable={false}
          zoomOnDoubleClick={false}
          edgesFocusable={false}
          edgesUpdatable={false}
          defaultNodes={[]} // Use setNodes/setEdges instead
          defaultEdges={[]} // Use setNodes/setEdges instead
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          proOptions={{ hideAttribution: true }}
        >
          <Background color={backgroundPatternColor} />
        </ReactFlow>
      )}
      {/* Display message if no primary node found, which shouldn't happen in normal flow */}
      {isSuccessReplicas && !isLoadingProject && !primary && (
        <p className="text-foreground-light text-sm">
          Could not load primary database information.
        </p>
      )}
    </div>
  )
}

const InstanceDiagram = (props: InstanceDiagramProps) => {
  return (
    <ReactFlowProvider>
      <InstanceDiagramUI {...props} />
    </ReactFlowProvider>
  )
}

export default InstanceDiagram
