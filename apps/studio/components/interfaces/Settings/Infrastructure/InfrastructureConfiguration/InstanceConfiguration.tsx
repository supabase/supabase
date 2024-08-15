import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { partition } from 'lodash'
import { ChevronDown, Globe2, Loader2, Network } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, { Background, Edge, ReactFlowProvider, useReactFlow } from 'reactflow'
import 'reactflow/dist/style.css'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useLoadBalancersQuery } from 'data/read-replicas/load-balancers-query'
import { Database, useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import {
  ReplicaInitializationStatus,
  useReadReplicasStatusesQuery,
} from 'data/read-replicas/replicas-status-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { timeout } from 'lib/helpers'
import { type AWS_REGIONS_KEYS } from 'shared-data'
import { useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
} from 'ui'
import ComputeInstanceSidePanel from '../../Addons/ComputeInstanceSidePanel'
import DeployNewReplicaPanel from './DeployNewReplicaPanel'
import DropAllReplicasConfirmationModal from './DropAllReplicasConfirmationModal'
import DropReplicaConfirmationModal from './DropReplicaConfirmationModal'
import { SmoothstepEdge } from './Edge'
import { REPLICA_STATUS } from './InstanceConfiguration.constants'
import { addRegionNodes, generateNodes, getDagreGraphLayout } from './InstanceConfiguration.utils'
import { LoadBalancerNode, PrimaryNode, RegionNode, ReplicaNode } from './InstanceNode'
import MapView from './MapView'
import { RestartReplicaConfirmationModal } from './RestartReplicaConfirmationModal'

const InstanceConfigurationUI = () => {
  const reactFlow = useReactFlow()
  const { resolvedTheme } = useTheme()
  const { ref: projectRef } = useParams()
  const numTransition = useRef<number>()
  const { project, isLoading: isLoadingProject } = useProjectContext()
  const snap = useSubscriptionPageStateSnapshot()

  const [view, setView] = useState<'flow' | 'map'>('flow')
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false)
  const [showNewReplicaPanel, setShowNewReplicaPanel] = useState(false)
  const [refetchInterval, setRefetchInterval] = useState<number | boolean>(10000)
  const [newReplicaRegion, setNewReplicaRegion] = useState<AWS_REGIONS_KEYS>()
  const [selectedReplicaToDrop, setSelectedReplicaToDrop] = useState<Database>()
  const [selectedReplicaToRestart, setSelectedReplicaToRestart] = useState<Database>()

  const canManageReplicas = useCheckPermissions(PermissionAction.CREATE, 'projects')

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

        // If any replica's status has changed, refetch databases
        if (
          numTransition.current !== replicasInTransition.length ||
          res.length !== (data ?? []).length
        ) {
          numTransition.current = replicasInTransition.length
          await refetchReplicas()
          setTimeout(() => refetchLoadBalancers(), 2000)
        }

        // If all replicas are active healthy, stop fetching statuses
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
        ? generateNodes({
            primary,
            replicas,
            loadBalancers: loadBalancers ?? [],
            onSelectRestartReplica: setSelectedReplicaToRestart,
            onSelectDropReplica: setSelectedReplicaToDrop,
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
    const graph = getDagreGraphLayout(nodes, edges)
    const { nodes: updatedNodes } = addRegionNodes(graph.nodes, graph.edges)
    reactFlow.setNodes(updatedNodes)
    reactFlow.setEdges(graph.edges)

    // [Joshen] Odd fix to ensure that react flow snaps back to center when adding nodes
    await timeout(1)
    reactFlow.fitView({ maxZoom: 0.9, minZoom: 0.9 })
  }

  // [Joshen] Just FYI this block is oddly triggering whenever we refocus on the viewport
  // even if I change the dependency array to just data. Not blocker, just an area to optimize
  useEffect(() => {
    if (isSuccessReplicas && isSuccessLoadBalancers && nodes.length > 0 && view === 'flow') {
      setReactFlow()
    }
  }, [isSuccessReplicas, isSuccessLoadBalancers, nodes, edges, view])

  return (
    <>
      <div
        className={`h-[500px] w-full relative ${
          isSuccessReplicas && !isLoadingProject ? '' : 'flex items-center justify-center px-28'
        }`}
      >
        {/* Sometimes the read replicas are loaded before the project info and causes  read replicas to be shown on Fly deploys.
            You can replicate this to going to this page and refresh. This isLoadingProject flag fixes that. */}
        {(isLoading || isLoadingProject) && (
          <Loader2 className="animate-spin text-foreground-light" />
        )}
        {isError && <AlertError error={error} subject="Failed to retrieve replicas" />}
        {isSuccessReplicas && !isLoadingProject && (
          <>
            <div className="z-10 absolute top-4 right-4 flex items-center justify-center gap-x-2">
              <div className="flex items-center justify-center">
                <ButtonTooltip
                  type="default"
                  disabled={!canManageReplicas}
                  className={cn(replicas.length > 0 ? 'rounded-r-none' : '')}
                  onClick={() => setShowNewReplicaPanel(true)}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: 'You need additional permissions to deploy replicas',
                    },
                  }}
                >
                  Deploy a new replica
                </ButtonTooltip>
                {replicas.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="default"
                        icon={<ChevronDown size={16} />}
                        className="px-1 rounded-l-none border-l-0"
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 *:space-x-2">
                      <DropdownMenuItem onClick={() => snap.setPanelKey('computeInstance')}>
                        <div>Resize databases</div>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowDeleteAllModal(true)}>
                        <div>Remove all replicas</div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              {project?.cloud_provider === 'AWS' && (
                <div className="flex items-center justify-center">
                  <Button
                    type="default"
                    icon={<Network size={15} />}
                    className={`rounded-r-none transition ${
                      view === 'flow' ? 'opacity-100' : 'opacity-50'
                    }`}
                    onClick={() => setView('flow')}
                  />
                  <Button
                    type="default"
                    icon={<Globe2 size={15} />}
                    className={`rounded-l-none transition ${
                      view === 'map' ? 'opacity-100' : 'opacity-50'
                    }`}
                    onClick={() => setView('map')}
                  />
                </div>
              )}
            </div>
            {view === 'flow' ? (
              <ReactFlow
                fitView
                fitViewOptions={{ minZoom: 0.9, maxZoom: 0.9 }}
                className="instance-configuration"
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
            ) : (
              <MapView
                onSelectDeployNewReplica={(region) => {
                  setNewReplicaRegion(region)
                  setShowNewReplicaPanel(true)
                }}
                onSelectRestartReplica={setSelectedReplicaToRestart}
                onSelectDropReplica={setSelectedReplicaToDrop}
              />
            )}
          </>
        )}
      </div>

      <DeployNewReplicaPanel
        visible={showNewReplicaPanel}
        selectedDefaultRegion={newReplicaRegion}
        onSuccess={() => setRefetchInterval(5000)}
        onClose={() => {
          setNewReplicaRegion(undefined)
          setShowNewReplicaPanel(false)
        }}
      />

      <DropReplicaConfirmationModal
        selectedReplica={selectedReplicaToDrop}
        onSuccess={() => setRefetchInterval(5000)}
        onCancel={() => setSelectedReplicaToDrop(undefined)}
      />

      <DropAllReplicasConfirmationModal
        visible={showDeleteAllModal}
        onSuccess={() => setRefetchInterval(5000)}
        onCancel={() => setShowDeleteAllModal(false)}
      />

      <RestartReplicaConfirmationModal
        selectedReplica={selectedReplicaToRestart}
        onSuccess={() => setRefetchInterval(5000)}
        onCancel={() => setSelectedReplicaToRestart(undefined)}
      />

      <ComputeInstanceSidePanel />
    </>
  )
}

const InstanceConfiguration = () => {
  return (
    <ReactFlowProvider>
      <InstanceConfigurationUI />
    </ReactFlowProvider>
  )
}

export default InstanceConfiguration
