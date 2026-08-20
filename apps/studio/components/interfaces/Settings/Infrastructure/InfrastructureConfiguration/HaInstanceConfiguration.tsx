import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import { Loader2 } from 'lucide-react'
import { useMemo } from 'react'

import { DiagramFlow } from './DiagramFlow'
import { HaReplicationEdge } from './HaEdge'
import { addShardNodes, generateHaNodesAndEdges } from './HaInstanceConfiguration.utils'
import { HaPrimaryNode, HaReplicaNode, HaShardNode, MultigatewayNode } from './HaInstanceNode'
import { buildHaTopology } from './HaTopology.utils'
import { HA_RANKSEP } from './InstanceConfiguration.constants'
import { AlertError } from '@/components/ui/AlertError'
import { HighAvailabilityDisabledEmptyState } from '@/components/ui/HighAvailability/HighAvailabilityDisabledEmptyState'
import { haClusterGatewaysQueryOptions } from '@/data/ha-admin/ha-cluster-gateways-query'
import {
  haClusterPoolersQueryOptions,
  type HaClusterPoolersData,
  type Multipooler,
} from '@/data/ha-admin/ha-cluster-poolers-query'

const nodeTypes = {
  HA_GATEWAY: MultigatewayNode,
  HA_PRIMARY: HaPrimaryNode,
  HA_REPLICA: HaReplicaNode,
  HA_SHARD: HaShardNode,
}

const edgeTypes = {
  HA_REPLICATION: HaReplicationEdge,
}

const POOLER_STATUS_REFRESH_MS = 30_000

// The topology (and therefore the diagram layout) only depends on each
// pooler's identity, shard, and routing role — live status is self-fetched by
// the individual nodes and edges. Selecting this projection lets React Query's
// structural sharing keep the result referentially stable across the 30s
// polls, so refetches only re-run layout/fitView when the topology actually
// changes (volatile fields like lifecycle timestamps would otherwise churn the
// data identity on every poll).
const selectTopologyPoolers = (data: HaClusterPoolersData): Multipooler[] =>
  (data.poolers ?? []).map((pooler) => ({
    id: pooler.id === undefined ? undefined : { cell: pooler.id.cell, name: pooler.id.name },
    shardKey:
      pooler.shardKey === undefined
        ? undefined
        : {
            database: pooler.shardKey.database,
            tableGroup: pooler.shardKey.tableGroup,
            shard: pooler.shardKey.shard,
          },
    routingState:
      pooler.routingState === undefined ? undefined : { role: pooler.routingState.role },
    type: pooler.type,
  }))

/**
 * Cluster topology diagram for High Availability (Multigres) projects:
 * gateway tier → shard group → primary + read replicas, driven by the
 * read-only multiadmin `/ha-admin` passthrough.
 */
export const HaInstanceConfiguration = () => {
  const { ref: projectRef } = useParams()

  const {
    data: gatewaysData,
    error: gatewaysError,
    isPending: isPendingGateways,
    isError: isErrorGateways,
  } = useQuery(haClusterGatewaysQueryOptions({ projectRef }))

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

  if (isPending) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-foreground-light" />
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
