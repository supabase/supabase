import {
  Background,
  ColorMode,
  Edge,
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
  useReactFlow,
} from '@xyflow/react'
import { partition } from 'lodash'
import { Globe2, Loader2, Network } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useEffectEvent, useMemo, useState } from 'react'

import '@xyflow/react/dist/style.css'

import { useParams } from 'common'
import { Button, cn } from 'ui'

import { SmoothstepEdge } from './Edge'
import { addRegionNodes, generateNodes, getDagreGraphLayout } from './InstanceConfiguration.utils'
import { LoadBalancerNode, PrimaryNode, RegionNode, ReplicaNode } from './InstanceNode'
import MapView from './MapView'
import { REPLICA_STATUS } from '@/components/interfaces/Database/Replication/Replication.constants'
import { AlertError } from '@/components/ui/AlertError'
import { useLoadBalancersQuery } from '@/data/read-replicas/load-balancers-query'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import {
  ReplicaInitializationStatus,
  useReadReplicasStatusesQuery,
} from '@/data/read-replicas/replicas-status-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useIsAwsCloudProvider, useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { timeout } from '@/lib/helpers'

const InstanceConfigurationUI = () => {
  const reactFlow = useReactFlow()
  const { resolvedTheme } = useTheme()
  const { ref: projectRef } = useParams()
  const { isPending: isLoadingProject } = useSelectedProjectQuery()

  const isAws = useIsAwsCloudProvider()
  const { infrastructureReadReplicas } = useIsFeatureEnabled(['infrastructure:read_replicas'])

  const [view, setView] = useState<'flow' | 'map'>('flow')
  const [refetchInterval, setRefetchInterval] = useState<number | false>(10000)

  const {
    data: loadBalancers,
    refetch: refetchLoadBalancers,
    isSuccess: isSuccessLoadBalancers,
  } = useLoadBalancersQuery({ projectRef })
  const {
    data,
    error,
    refetch: refetchReplicas,
    isPending: isLoading,
    isError,
    isSuccess: isSuccessReplicas,
  } = useReadReplicasQuery({ projectRef })
  const [[primary], replicas] = useMemo(
    () => partition(data ?? [], (db) => db.identifier === projectRef),
    [data, projectRef]
  )
  const numReplicas = useMemo(() => data?.length ?? 0, [data])

  const { data: replicasStatuses, isSuccess: isSuccessReplicasStatuses } =
    useReadReplicasStatusesQuery(
      { projectRef },
      {
        refetchInterval: refetchInterval,
        refetchOnWindowFocus: false,
      }
    )

  useEffect(() => {
    if (!isSuccessReplicasStatuses) return
    const refetch = async () => {
      const fixedStatues = [
        REPLICA_STATUS.ACTIVE_HEALTHY,
        REPLICA_STATUS.ACTIVE_UNHEALTHY,
        REPLICA_STATUS.INIT_READ_REPLICA_FAILED,
      ]
      const replicasInTransition = replicasStatuses.filter((db) => {
        const { status } = db.replicaInitializationStatus || {}
        return (
          !fixedStatues.includes(db.status) || status === ReplicaInitializationStatus.InProgress
        )
      })
      const hasTransientStatus = replicasInTransition.length > 0

      // If any replica's status has changed, refetch databases
      if (replicasStatuses.length !== numReplicas) {
        await refetchReplicas()
        setTimeout(() => refetchLoadBalancers(), 2000)
      }

      // If all replicas are active healthy, stop fetching statuses
      if (!hasTransientStatus) {
        setRefetchInterval(false)
      }
    }
    refetch()
  }, [
    numReplicas,
    isSuccessReplicasStatuses,
    refetchLoadBalancers,
    refetchReplicas,
    replicasStatuses,
  ])

  const backgroundPatternColor =
    resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)'

  const nodes = useMemo(
    () =>
      isSuccessReplicas && isSuccessLoadBalancers && primary !== undefined
        ? generateNodes({
            primary,
            replicas,
            loadBalancers: loadBalancers ?? [],
          })
        : [],
    [isSuccessReplicas, isSuccessLoadBalancers, primary, replicas, loadBalancers]
  )

  const edges: Edge[] = useMemo(
    () =>
      isSuccessReplicas && isSuccessLoadBalancers
        ? [
            ...((loadBalancers ?? []).length > 0
              ? [
                  {
                    id: `load-balancer-${primary.identifier}`,
                    source: 'load-balancer',
                    target: primary.identifier,
                    type: 'smoothstep',
                    animated: true,
                    className: 'cursor-default!',
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
                className: 'cursor-default!',
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

  const nodesInitialized = useNodesInitialized()
  const [hasMeasuredLayout, setHasMeasuredLayout] = useState(false)

  const setReactFlow = async ({ measured }: { measured: boolean }) => {
    // Merge in React Flow's measured dimensions (if any) so dagre can use real
    // heights instead of the first-paint fallbacks.
    const measuredNodes = nodes.map((node) => {
      const existing = reactFlow.getNode(node.id)
      return existing?.measured ? { ...node, measured: existing.measured } : node
    })
    const graph = getDagreGraphLayout(measuredNodes, edges)
    const { nodes: updatedNodes } = addRegionNodes(graph.nodes, graph.edges)
    reactFlow.setNodes(updatedNodes)
    reactFlow.setEdges(graph.edges)

    // [Joshen] Odd fix to ensure that react flow snaps back to center when adding nodes
    await timeout(1)
    reactFlow.fitView({ maxZoom: 0.9, minZoom: 0.9 })
    if (measured) setHasMeasuredLayout(true)
  }

  // First pass: lay out using fallback heights for any not-yet-measured nodes.
  // The diagram is kept invisible until the measured pass below has run, so the
  // user never sees the fallback positions.
  // [Joshen] Just FYI this block is oddly triggering whenever we refocus on the viewport
  // even if I change the dependency array to just data. Not blocker, just an area to optimize
  useEffect(() => {
    if (isSuccessReplicas && isSuccessLoadBalancers && nodes.length > 0 && view === 'flow') {
      setReactFlow({ measured: false })
    }
  }, [isSuccessReplicas, isSuccessLoadBalancers, nodes, edges, view])

  // Second pass: once React Flow has measured the nodes, re-run the layout so
  // dagre uses real heights. Only `nodesInitialized` going true should trigger
  // this — the first-pass effect above handles node/view changes.
  const runMeasuredLayout = useEffectEvent(() => {
    if (nodesInitialized && nodes.length > 0 && view === 'flow') {
      setReactFlow({ measured: true })
    }
  })
  useEffect(() => {
    runMeasuredLayout()
  }, [nodesInitialized])

  return (
    <div className={cn('nowheel h-full')}>
      <div
        className={`h-full w-full relative ${
          isSuccessReplicas && !isLoadingProject ? '' : 'flex items-center justify-center px-28'
        }`}
      >
        {(isLoading || isLoadingProject) && (
          <Loader2 className="animate-spin text-foreground-light" />
        )}
        {isError && <AlertError error={error} subject="Failed to retrieve replicas" />}
        {isSuccessReplicas && !isLoadingProject && (
          <>
            {infrastructureReadReplicas && (
              <div className="z-10 absolute top-4 right-4 flex items-center justify-center gap-x-2">
                {isAws && (
                  <div className="flex items-center justify-center">
                    <Button
                      variant="default"
                      icon={<Network size={15} />}
                      className={`rounded-r-none transition ${
                        view === 'flow' ? 'opacity-100' : 'opacity-50'
                      }`}
                      onClick={() => setView('flow')}
                    />
                    <Button
                      variant="default"
                      icon={<Globe2 size={15} />}
                      className={`rounded-l-none transition ${
                        view === 'map' ? 'opacity-100' : 'opacity-50'
                      }`}
                      onClick={() => setView('map')}
                    />
                  </div>
                )}
              </div>
            )}
            {view === 'flow' ? (
              <ReactFlow
                // FIXME: https://github.com/xyflow/xyflow/issues/4876
                colorMode={'' as unknown as ColorMode}
                fitView
                fitViewOptions={{ minZoom: 0.9, maxZoom: 0.9 }}
                // Keep the diagram invisible (but laid out, so nodes can be
                // measured) until the measured-height layout pass has run.
                className={cn(
                  'instance-configuration transition-opacity duration-150',
                  hasMeasuredLayout ? 'opacity-100' : 'opacity-0'
                )}
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
            ) : (
              <MapView />
            )}
          </>
        )}
      </div>
    </div>
  )
}

export const InstanceConfiguration = () => {
  return (
    <ReactFlowProvider>
      <InstanceConfigurationUI />
    </ReactFlowProvider>
  )
}
