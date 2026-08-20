import { groupBy, partition } from 'lodash'

import type { ReplicationState } from '@/components/ui/ReactFlow/getEdgeVisual'
import type { Multigateway } from '@/data/ha-admin/ha-cluster-gateways-query'
import type { Multipooler } from '@/data/ha-admin/ha-cluster-poolers-query'

/**
 * Pure helpers mapping the multiadmin cluster state (gateways + poolers) onto
 * the shapes the High Availability infrastructure diagram renders. Every field
 * on the multiadmin responses is optional because proto3 JSON omits zero
 * values — an absent field means "the default", not "missing data".
 */

export type HaPoolerStatus = 'healthy' | 'coming_up' | 'going_down' | 'unhealthy'

export interface HaShard {
  id: string
  name: string
  primary?: Multipooler
  replicas: Multipooler[]
}

export interface HaTopology {
  gateways: Multigateway[]
  shards: HaShard[]
}

export const getPoolerKey = (pooler: Multipooler) =>
  `${pooler.id?.cell ?? 'unknown'}-${pooler.id?.name ?? 'unknown'}`

/**
 * `routingState.role` is the authoritative writable signal; the deprecated
 * `type` field is derived and only used as a fallback when the routing state is
 * missing. The role is omitted entirely when it is ROUTING_ROLE_UNKNOWN
 * (proto3 zero value).
 */
export const isPrimaryPooler = (pooler: Multipooler) => {
  const role = pooler.routingState?.role
  if (role !== undefined) return role === 'ROUTING_ROLE_PRIMARY'
  return pooler.type === 'PRIMARY'
}

export const getPoolerStatus = (pooler: Multipooler): HaPoolerStatus => {
  // Lifecycle values may arrive with or without the proto enum prefix.
  const lifecycle = (pooler.lifecycleStatus?.status ?? '').replace(/^LIFECYCLE_/, '')

  if (lifecycle === 'QUARANTINED' || lifecycle === 'SHUTDOWN') return 'unhealthy'
  if (lifecycle === 'STARTING') return 'coming_up'
  if (lifecycle === 'STOPPING') return 'going_down'

  // Lifecycle is ACTIVE or unknown: fall back to the serving status. An absent
  // servingStatus means SERVING (proto3 zero value), i.e. the node is taking
  // traffic, so the default reads as healthy.
  if (pooler.servingStatus === 'DRAINING') return 'going_down'
  if (pooler.servingStatus === 'DISABLED') return 'unhealthy'
  return 'healthy'
}

// Matches the status vocabulary of the read replica surfaces (getStatusLabel).
export const HA_POOLER_STATUS_LABELS: Record<HaPoolerStatus, string> = {
  healthy: 'Healthy',
  coming_up: 'Coming up',
  going_down: 'Going down',
  unhealthy: 'Unhealthy',
}

// A pooler that is going down is neither replicating nor failed, which renders
// as the "stopped" edge visual.
export const getPoolerEdgeState = (status: HaPoolerStatus): ReplicationState => ({
  isReplicating: status === 'healthy',
  isComingUp: status === 'coming_up',
  isFailed: status === 'unhealthy',
})

const AWS_AZ_REGEX = /\b[a-z]{2}(?:-[a-z]+)+-\d[a-z]\b/

/**
 * Cells map 1:1 to availability zones in the alpha, but the exact cell naming
 * format is unconfirmed — extract an AZ-shaped substring when there is one and
 * fall back to the raw cell name otherwise.
 */
export const formatCellAsAvailabilityZone = (cell: string | undefined) => {
  if (!cell) return undefined
  return AWS_AZ_REGEX.exec(cell)?.[0] ?? cell
}

export const buildHaTopology = ({
  gateways,
  poolers,
}: {
  gateways: Multigateway[]
  poolers: Multipooler[]
}): HaTopology => {
  const sortedPoolers = [...poolers].sort((a, b) => getPoolerKey(a).localeCompare(getPoolerKey(b)))
  const poolersByShard = groupBy(
    sortedPoolers,
    (pooler) =>
      `${pooler.shardKey?.database ?? ''}/${pooler.shardKey?.tableGroup ?? ''}/${pooler.shardKey?.shard ?? ''}`
  )

  const shards = Object.entries(poolersByShard)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, shardPoolers], index) => {
      // A shard should only ever have one primary; if the data disagrees, the
      // first one renders as the primary and the rest as replicas rather than
      // dropping nodes.
      const [primaries, replicas] = partition(shardPoolers, isPrimaryPooler)
      return {
        id,
        name: `Shard ${index + 1}`,
        primary: primaries[0],
        replicas: [...primaries.slice(1), ...replicas],
      }
    })

  return { gateways, shards }
}
