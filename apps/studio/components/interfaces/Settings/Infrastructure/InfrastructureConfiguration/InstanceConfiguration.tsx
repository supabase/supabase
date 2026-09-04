import { Edge, ReactFlowProvider } from '@xyflow/react'
import { useParams } from 'common'
import { partition } from 'lodash'
import { Globe2, Loader2, Network } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from 'ui'

import { DiagramFlow } from './DiagramFlow'
import { SmoothstepEdge } from './Edge'
import { HaInstanceConfiguration } from './HaInstanceConfiguration'
import { addRegionNodes, generateNodes } from './InstanceConfiguration.utils'
import { LoadBalancerNode, PrimaryNode, RegionNode, ReplicaNode } from './InstanceNode'
import MapView from './MapView'
import { REPLICA_STATUS } from '@/components/interfaces/Settings/Infrastructure/ReadReplicas/ReadReplicas.constants'
import { AlertError } from '@/components/ui/AlertError'
import { useLoadBalancersQuery } from '@/data/read-replicas/load-balancers-query'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import {
  ReplicaInitializationStatus,
  useReadReplicasStatusesQuery,
} from '@/data/read-replicas/replicas-status-query'
import { useHighAvailability } from '@/hooks/misc/useHighAvailability'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useIsAwsCloudProvider, useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const nodeTypes = {
  PRIMARY: PrimaryNode,
  READ_REPLICA: ReplicaNode,
  REGION: RegionNode,
  LOAD_BALANCER: LoadBalancerNode,
}

const edgeTypes = {
  smoothstep: SmoothstepEdge,
}

const InstanceConfigurationUI = () => {
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
                    // Static: no data flows between the load balancer and the
                    // database — the line only indicates a relation.
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

  return (
    <div className="nowheel h-full">
      <div
        className={`h-full w-full relative ${
          isSuccessReplicas && !isLoadingProject ? '' : 'flex items-center justify-center px-28'
        }`}
      >
        {(isLoading || isLoadingProject) && (
          <div role="status">
            <span className="sr-only">Loading infrastructure...</span>
            <Loader2
              aria-hidden="true"
              className="motion-safe:animate-spin text-foreground-light"
            />
          </div>
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
              <DiagramFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                addGroupNodes={addRegionNodes}
              />
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
  const { isHighAvailability, isPending } = useHighAvailability()

  // Wait for the project record so an HA project never briefly mounts the
  // standard diagram (and fires its queries) before swapping.
  if (isPending) {
    return (
      <div role="status" className="h-full w-full flex items-center justify-center">
        <span className="sr-only">Loading infrastructure...</span>
        <Loader2 aria-hidden="true" className="motion-safe:animate-spin text-foreground-light" />
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      {isHighAvailability ? <HaInstanceConfiguration /> : <InstanceConfigurationUI />}
    </ReactFlowProvider>
  )
}
