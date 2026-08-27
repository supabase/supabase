import { groupBy, partition, uniqBy } from 'lodash'

import type { Multigateway } from '@/data/ha-admin/ha-cluster-gateways-query'
import type { HaClusterPoolersData, Multipooler } from '@/data/ha-admin/ha-cluster-poolers-query'

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

export const getPoolerKey = (pooler: Pick<Multipooler, 'id'>) =>
  `${pooler.id?.cell ?? 'unknown'}-${pooler.id?.name ?? 'unknown'}`

export const hasPoolerIdentity = (pooler: Pick<Multipooler, 'id'>) =>
  pooler.id?.cell !== undefined && pooler.id?.name !== undefined

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

/**
 * Health as reported by the pooler's topology record — not a live probe: a
 * pooler that crashes without publishing STOPPING/SHUTDOWN can leave an
 * ACTIVE/SERVING record behind until the topology evicts it, and "healthy"
 * says nothing about replication progress. Live signals (WAL receiver state,
 * replay position) exist on `GET /poolers/{cell}/{name}/status` but require a
 * per-pooler fanout.
 */
export const getPoolerStatus = (pooler: Multipooler): HaPoolerStatus => {
  // Lifecycle values may arrive with or without the proto enum prefix.
  const lifecycle = (pooler.lifecycleStatus?.status ?? '').replace(/^LIFECYCLE_/, '')

  // The proto's two terminal states: QUARANTINED (gave up recovering, kept alive
  // for forensics) and SHUTDOWN (durably down). There is no separate FAILED state.
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

// Labels are drawn from the read replica status vocabulary (`getStatusLabel` in
// ReadReplicas.utils.ts) so both surfaces read the same way, but they are only a
// subset of it. The read replica labels also cover 'Failed', 'Restarting',
// 'Resizing' and 'Restoring'; the multipooler lifecycle enum has no equivalents —
// its only failure state, QUARANTINED, is surfaced as 'Unhealthy' alongside
// SHUTDOWN.
export const HA_POOLER_STATUS_LABELS: Record<HaPoolerStatus, string> = {
  healthy: 'Healthy',
  coming_up: 'Coming up',
  going_down: 'Going down',
  unhealthy: 'Unhealthy',
}

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

// Routing-rule terms are proto int64s, serialized as strings in JSON and
// omitted when zero. Failover counts stay far below Number's safe range.
const parseTerm = (value: string | undefined) => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

// Orders two primary claimants by routing rule: (coordinator term, leader
// subterm), greatest wins.
const compareRoutingRules = (a: Multipooler, b: Multipooler) => {
  const ruleA = a.routingState?.rule
  const ruleB = b.routingState?.rule
  return (
    parseTerm(ruleA?.coordinatorTerm) - parseTerm(ruleB?.coordinatorTerm) ||
    parseTerm(ruleA?.leaderSubterm) - parseTerm(ruleB?.leaderSubterm)
  )
}

export const buildHaTopology = ({
  gateways,
  poolers,
}: {
  gateways: Multigateway[]
  poolers: Multipooler[]
}): HaTopology => {
  // The /ha-admin passthrough can return the same record multiple times (one
  // copy per cell it fans out to), so both lists must be deduped by id —
  // duplicate poolers would otherwise produce duplicate React Flow node ids,
  // and extra copies of the primary would render as replicas. Records without
  // a complete identity can't be told apart, so they are never deduped (keying
  // by the record itself keeps each one unique).
  const uniqueGateways = uniqBy(gateways, (gateway) =>
    hasPoolerIdentity(gateway) ? getPoolerKey(gateway) : gateway
  )
  const uniquePoolers = uniqBy(poolers, (pooler) =>
    hasPoolerIdentity(pooler) ? getPoolerKey(pooler) : pooler
  )

  const sortedPoolers = [...uniquePoolers].sort((a, b) =>
    getPoolerKey(a).localeCompare(getPoolerKey(b))
  )
  const poolersByShard = groupBy(
    sortedPoolers,
    (pooler) =>
      `${pooler.shardKey?.database ?? ''}/${pooler.shardKey?.tableGroup ?? ''}/${pooler.shardKey?.shard ?? ''}`
  )

  const shards = Object.entries(poolersByShard)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, shardPoolers], index) => {
      const [primaries, replicas] = partition(shardPoolers, isPrimaryPooler)
      // During a failover the outgoing and incoming primary can briefly both
      // claim ROUTING_ROLE_PRIMARY — the highest routing rule wins, matching
      // the multigateway's election. Losing claimants render as replicas
      // rather than being dropped; ties keep the first in sorted order so the
      // result stays deterministic.
      const primary = primaries.reduce<Multipooler | undefined>(
        (best, candidate) =>
          best === undefined || compareRoutingRules(candidate, best) > 0 ? candidate : best,
        undefined
      )
      return {
        id,
        name: `Shard ${index + 1}`,
        primary,
        replicas: [...primaries.filter((pooler) => pooler !== primary), ...replicas],
      }
    })

  return { gateways: uniqueGateways, shards }
}

/**
 * Query `select` projecting poolers down to the fields the topology depends on
 * (identity, shard, routing role) — live status is self-fetched by the
 * individual nodes and edges. React Query's structural sharing then keeps the
 * result referentially stable across polls, so refetches only re-run
 * layout/fitView when the topology actually changes (volatile fields like
 * lifecycle timestamps would otherwise churn the data identity on every poll).
 */
const projectRoutingRule = (rule: NonNullable<Multipooler['routingState']>['rule']) =>
  rule === undefined
    ? undefined
    : { coordinatorTerm: rule.coordinatorTerm, leaderSubterm: rule.leaderSubterm }

const projectRoutingState = (routingState: Multipooler['routingState']) =>
  routingState === undefined
    ? undefined
    : { role: routingState.role, rule: projectRoutingRule(routingState.rule) }

export const selectTopologyPoolers = (data: HaClusterPoolersData): Multipooler[] =>
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
    routingState: projectRoutingState(pooler.routingState),
    type: pooler.type,
  }))
