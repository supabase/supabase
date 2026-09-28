import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { Loader2 } from 'lucide-react'
import { useMemo } from 'react'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import { DiagramFlow } from './DiagramFlow'
import { addShardNodes, generateHaNodesAndEdges } from './HaInstanceConfiguration.utils'
import { HaPrimaryNode, HaReplicaNode, HaShardNode, MultigatewayNode } from './HaInstanceNode'
import { buildHaTopology, selectTopologyPoolers } from './HaTopology.utils'
import { HA_RANKSEP } from './InstanceConfiguration.constants'
import { AlertError } from '@/components/ui/AlertError'
import { HighAvailabilityDisabledEmptyState } from '@/components/ui/HighAvailability/HighAvailabilityDisabledEmptyState'
import { haClusterGatewaysQueryOptions } from '@/data/ha-admin/ha-cluster-gateways-query'
import { haClusterPoolersQueryOptions } from '@/data/ha-admin/ha-cluster-poolers-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'

const nodeTypes = {
  HA_GATEWAY: MultigatewayNode,
  HA_PRIMARY: HaPrimaryNode,
  HA_REPLICA: HaReplicaNode,
  HA_SHARD: HaShardNode,
}

// The gateway and replication edges both use React Flow's built-in smoothstep.
const edgeTypes = {}

const POOLER_STATUS_REFRESH_MS = 30_000

/**
 * Cluster topology diagram for High Availability (Multigres) projects:
 * gateway tier → shard group → primary + read replicas, driven by the
 * read-only multiadmin `/ha-admin` passthrough.
 */
export const HaInstanceConfiguration = () => {
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const isProjectBuilding =
    project?.status === PROJECT_STATUS.COMING_UP || project?.status === PROJECT_STATUS.UNKNOWN

  // Gateways poll on the same interval as poolers so the gateway count and
  // gateway→primary edge track cluster changes while the page stays open.
  const {
    data: gatewaysData,
    error: gatewaysError,
    isPending: isPendingGateways,
    isError: isErrorGateways,
  } = useQuery({
    ...haClusterGatewaysQueryOptions({ projectRef }),
    refetchInterval: POOLER_STATUS_REFRESH_MS,
  })

  const {
    data: poolers,
    error: poolersError,
    isPending: isPendingPoolers,
    isError: isErrorPoolers,
  } = useQuery({
    ...haClusterPoolersQueryOptions({ projectRef }),
    refetchInterval: POOLER_STATUS_REFRESH_MS,
    select: selectTopologyPoolers,
  })

  const gateways = gatewaysData?.gateways

  const { nodes, edges } = useMemo(
    () =>
      generateHaNodesAndEdges(
        buildHaTopology({ gateways: gateways ?? [], poolers: poolers ?? [] })
      ),
    [gateways, poolers]
  )

  const isPending = isPendingGateways || isPendingPoolers
  const isError = isErrorGateways || isErrorPoolers
  const error = gatewaysError ?? poolersError

  // While the project is provisioning, the /ha-admin endpoints fail or return an
  // empty topology as a matter of course — that's a project still booting, not an
  // unhealthy cluster.
  const isProvisioning = isProjectBuilding && (isError || (poolers ?? []).length === 0)

  // The initial load and the provisioning placeholder share one persistent
  // role="status" live region so screen readers announce the transition between
  // them — a live region only announces updates to content it already contains.
  if (isPending || isProvisioning) {
    return (
      <div role="status" className="h-full w-full flex items-center justify-center p-6">
        {isPending ? (
          <>
            <span className="sr-only">Loading cluster topology...</span>
            <Loader2
              aria-hidden="true"
              className="motion-safe:animate-spin text-foreground-light"
            />
          </>
        ) : (
          <EmptyStatePresentational
            icon={
              <Loader2
                size={24}
                strokeWidth={1.5}
                aria-hidden="true"
                className="motion-safe:animate-spin text-foreground-muted"
              />
            }
            title="Setting up project"
            description="Cluster topology will be available once your project is ready. This may take a few minutes."
            className="max-w-md"
          />
        )}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="h-full w-full flex items-center justify-center px-28">
        <AlertError error={error} subject="Failed to retrieve cluster topology" />
      </div>
    )
  }

  if ((poolers ?? []).length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center p-6">
        <HighAvailabilityDisabledEmptyState
          title="Cluster topology unavailable"
          description="Topology data for this project is not available yet. Contact support if this persists."
        />
      </div>
    )
  }

  return (
    <div className="nowheel h-full w-full relative">
      <DiagramFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        addGroupNodes={addShardNodes}
        ranksep={HA_RANKSEP}
      />
    </div>
  )
}
