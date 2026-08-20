import { describe, expect, it } from 'vitest'

import {
  buildHaTopology,
  formatCellAsAvailabilityZone,
  getPoolerEdgeState,
  getPoolerStatus,
  isPrimaryPooler,
  selectTopologyPoolers,
} from './HaTopology.utils'
import type { Multipooler } from '@/data/ha-admin/ha-cluster-poolers-query'

const primaryPooler = (overrides: Partial<Multipooler> = {}): Multipooler => ({
  id: { cell: 'eu-central-1a', name: 'pooler-1' },
  shardKey: { database: 'postgres', shard: '0' },
  routingState: { role: 'ROUTING_ROLE_PRIMARY' },
  ...overrides,
})

const replicaPooler = (overrides: Partial<Multipooler> = {}): Multipooler => ({
  id: { cell: 'eu-central-1b', name: 'pooler-2' },
  shardKey: { database: 'postgres', shard: '0' },
  routingState: { role: 'ROUTING_ROLE_REPLICA' },
  ...overrides,
})

describe('isPrimaryPooler', () => {
  it('uses routingState.role as the authoritative signal', () => {
    expect(isPrimaryPooler(primaryPooler())).toBe(true)
    expect(isPrimaryPooler(replicaPooler())).toBe(false)
  })

  it('prefers routingState.role over the deprecated type field', () => {
    expect(isPrimaryPooler(replicaPooler({ type: 'PRIMARY' }))).toBe(false)
  })

  it('falls back to the deprecated type field when routingState is omitted', () => {
    expect(isPrimaryPooler({ type: 'PRIMARY' })).toBe(true)
    expect(isPrimaryPooler({ type: 'REPLICA' })).toBe(false)
  })

  it('treats a pooler with every field omitted as a replica', () => {
    expect(isPrimaryPooler({})).toBe(false)
  })
})

describe('getPoolerStatus', () => {
  it('treats a pooler with every field omitted as healthy (proto3 zero values mean SERVING)', () => {
    expect(getPoolerStatus({})).toBe('healthy')
  })

  it('maps lifecycle states with or without the proto enum prefix', () => {
    expect(getPoolerStatus({ lifecycleStatus: { status: 'STARTING' } })).toBe('coming_up')
    expect(getPoolerStatus({ lifecycleStatus: { status: 'LIFECYCLE_STARTING' } })).toBe('coming_up')
    expect(getPoolerStatus({ lifecycleStatus: { status: 'STOPPING' } })).toBe('going_down')
    expect(getPoolerStatus({ lifecycleStatus: { status: 'SHUTDOWN' } })).toBe('unhealthy')
    expect(getPoolerStatus({ lifecycleStatus: { status: 'QUARANTINED' } })).toBe('unhealthy')
  })

  it('falls back to serving status when the lifecycle is active', () => {
    const active = { lifecycleStatus: { status: 'ACTIVE' } }
    expect(getPoolerStatus({ ...active })).toBe('healthy')
    expect(getPoolerStatus({ ...active, servingStatus: 'DRAINING' })).toBe('going_down')
    expect(getPoolerStatus({ ...active, servingStatus: 'DISABLED' })).toBe('unhealthy')
    expect(getPoolerStatus({ ...active, servingStatus: 'SERVING' })).toBe('healthy')
  })

  it('prioritizes a terminal lifecycle over the serving status', () => {
    expect(
      getPoolerStatus({ lifecycleStatus: { status: 'QUARANTINED' }, servingStatus: 'SERVING' })
    ).toBe('unhealthy')
  })
})

describe('getPoolerEdgeState', () => {
  it('maps each status onto a single edge state', () => {
    expect(getPoolerEdgeState('healthy')).toEqual({
      isReplicating: true,
      isComingUp: false,
      isFailed: false,
    })
    expect(getPoolerEdgeState('coming_up')).toEqual({
      isReplicating: false,
      isComingUp: true,
      isFailed: false,
    })
    expect(getPoolerEdgeState('unhealthy')).toEqual({
      isReplicating: false,
      isComingUp: false,
      isFailed: true,
    })
    // Going down renders as the stopped edge visual.
    expect(getPoolerEdgeState('going_down')).toEqual({
      isReplicating: false,
      isComingUp: false,
      isFailed: false,
    })
  })
})

describe('formatCellAsAvailabilityZone', () => {
  it('returns an AZ-shaped cell as is', () => {
    expect(formatCellAsAvailabilityZone('eu-central-1a')).toBe('eu-central-1a')
  })

  it('extracts an AZ-shaped substring from a longer cell name', () => {
    expect(formatCellAsAvailabilityZone('cell-eu-central-1a')).toBe('eu-central-1a')
    expect(formatCellAsAvailabilityZone('ap-southeast-2c-0')).toBe('ap-southeast-2c')
  })

  it('falls back to the raw cell name when no AZ shape is found', () => {
    expect(formatCellAsAvailabilityZone('cell-1')).toBe('cell-1')
  })

  it('returns undefined for an omitted cell', () => {
    expect(formatCellAsAvailabilityZone(undefined)).toBeUndefined()
    expect(formatCellAsAvailabilityZone('')).toBeUndefined()
  })
})

describe('selectTopologyPoolers', () => {
  it('projects poolers down to identity, shard, and routing role', () => {
    const projected = selectTopologyPoolers({
      poolers: [
        {
          id: { cell: 'cell-1', name: 'p-1' },
          shardKey: { database: 'postgres', tableGroup: 'default', shard: '0-inf' },
          type: 'PRIMARY',
          hostname: 'some-host',
          servingStatus: 'DRAINING',
          lifecycleStatus: { status: 'LIFECYCLE_ACTIVE' },
          routingState: { role: 'ROUTING_ROLE_PRIMARY' },
        },
      ],
    })

    // Volatile fields (lifecycle, serving status, hostname) are dropped so the
    // projection stays deep-equal across polls when the topology is unchanged.
    expect(projected).toEqual([
      {
        id: { cell: 'cell-1', name: 'p-1' },
        shardKey: { database: 'postgres', tableGroup: 'default', shard: '0-inf' },
        routingState: { role: 'ROUTING_ROLE_PRIMARY' },
        type: 'PRIMARY',
      },
    ])
  })

  it('preserves omitted fields as undefined and handles an empty response', () => {
    expect(selectTopologyPoolers({})).toEqual([])
    expect(selectTopologyPoolers({ poolers: [{}] })).toEqual([
      { id: undefined, shardKey: undefined, routingState: undefined, type: undefined },
    ])
  })
})

describe('buildHaTopology', () => {
  it('groups poolers into a shard with a primary and replicas', () => {
    const primary = primaryPooler()
    const replicaB = replicaPooler()
    const replicaC = replicaPooler({ id: { cell: 'eu-central-1c', name: 'pooler-3' } })

    const topology = buildHaTopology({
      gateways: [{ id: { cell: 'eu-central-1a', name: 'gateway-1' } }],
      poolers: [replicaC, primary, replicaB],
    })

    expect(topology.gateways).toHaveLength(1)
    expect(topology.shards).toHaveLength(1)
    expect(topology.shards[0].name).toBe('Shard 1')
    expect(topology.shards[0].primary).toEqual(primary)
    // Replicas are sorted by cell/name for a stable layout.
    expect(topology.shards[0].replicas).toEqual([replicaB, replicaC])
  })

  it('splits poolers with different shard keys into separate shards', () => {
    const topology = buildHaTopology({
      gateways: [],
      poolers: [
        primaryPooler({ shardKey: { database: 'postgres', shard: '1' } }),
        primaryPooler({
          id: { cell: 'eu-central-1b', name: 'pooler-9' },
          shardKey: { database: 'postgres', shard: '0' },
        }),
      ],
    })

    expect(topology.shards).toHaveLength(2)
    expect(topology.shards.map((shard) => shard.name)).toEqual(['Shard 1', 'Shard 2'])
    expect(topology.shards[0].primary?.shardKey?.shard).toBe('0')
    expect(topology.shards[1].primary?.shardKey?.shard).toBe('1')
  })

  it('groups poolers with omitted shard keys into a single shard', () => {
    const topology = buildHaTopology({
      gateways: [],
      poolers: [primaryPooler({ shardKey: undefined }), replicaPooler({ shardKey: undefined })],
    })

    expect(topology.shards).toHaveLength(1)
    expect(topology.shards[0].replicas).toHaveLength(1)
  })

  it('keeps extra primaries as replicas instead of dropping them', () => {
    const first = primaryPooler()
    const second = primaryPooler({ id: { cell: 'eu-central-1b', name: 'pooler-2' } })

    const topology = buildHaTopology({ gateways: [], poolers: [second, first] })

    expect(topology.shards[0].primary).toEqual(first)
    expect(topology.shards[0].replicas).toEqual([second])
  })

  it('handles a shard with no primary', () => {
    const topology = buildHaTopology({ gateways: [], poolers: [replicaPooler()] })

    expect(topology.shards[0].primary).toBeUndefined()
    expect(topology.shards[0].replicas).toHaveLength(1)
  })

  it('dedupes repeated records by id (the passthrough returns one copy per cell)', () => {
    const gateway = { id: { cell: 'cell-1', name: 'gw-1' } }
    const primary = primaryPooler({
      id: { cell: 'cell-1', name: 'p-1' },
      lifecycleStatus: { status: 'LIFECYCLE_ACTIVE' },
    })
    const replica = replicaPooler({ id: { cell: 'cell-2', name: 'p-2' } })

    const topology = buildHaTopology({
      gateways: [gateway, gateway, gateway],
      poolers: [primary, replica, primary, replica, primary, replica],
    })

    expect(topology.gateways).toEqual([gateway])
    expect(topology.shards).toHaveLength(1)
    // Duplicate copies of the primary must not be demoted to replicas.
    expect(topology.shards[0].primary).toEqual(primary)
    expect(topology.shards[0].replicas).toEqual([replica])
  })

  it('returns an empty topology for empty responses', () => {
    const topology = buildHaTopology({ gateways: [], poolers: [] })

    expect(topology.gateways).toEqual([])
    expect(topology.shards).toEqual([])
  })
})
