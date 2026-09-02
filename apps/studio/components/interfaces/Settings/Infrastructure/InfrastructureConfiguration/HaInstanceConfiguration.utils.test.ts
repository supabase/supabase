import { describe, expect, it } from 'vitest'

import { addShardNodes, generateHaNodesAndEdges } from './HaInstanceConfiguration.utils'
import { buildHaTopology } from './HaTopology.utils'
import { HA_RANKSEP } from './InstanceConfiguration.constants'
import { getDagreGraphLayout } from './InstanceConfiguration.utils'

const failoverTopology = () =>
  buildHaTopology({
    gateways: [{ id: { cell: 'cell-1', name: 'gw-1' } }],
    poolers: [
      {
        id: { cell: 'cell-1', name: 'p-1' },
        shardKey: { shard: '0' },
        routingState: { role: 'ROUTING_ROLE_PRIMARY' },
      },
      {
        id: { cell: 'cell-2', name: 'p-2' },
        shardKey: { shard: '0' },
        routingState: { role: 'ROUTING_ROLE_REPLICA' },
      },
      {
        id: { cell: 'cell-3', name: 'p-3' },
        shardKey: { shard: '0' },
        routingState: { role: 'ROUTING_ROLE_REPLICA' },
      },
    ],
  })

describe('generateHaNodesAndEdges', () => {
  it('gives every pooler a unique node id even when identities are omitted', () => {
    const topology = buildHaTopology({
      gateways: [],
      poolers: [
        {
          id: { cell: 'cell-1', name: 'p-1' },
          shardKey: { shard: '0' },
          routingState: { role: 'ROUTING_ROLE_PRIMARY' },
        },
        { shardKey: { shard: '0' }, routingState: { role: 'ROUTING_ROLE_REPLICA' } },
        { shardKey: { shard: '0' }, routingState: { role: 'ROUTING_ROLE_REPLICA' } },
      ],
    })

    const { nodes, edges } = generateHaNodesAndEdges(topology)
    const poolerNodeIds = nodes
      .filter((node) => node.type === 'HA_PRIMARY' || node.type === 'HA_REPLICA')
      .map((node) => node.id)

    expect(poolerNodeIds).toHaveLength(3)
    expect(new Set(poolerNodeIds).size).toBe(3)
    // Each replica still gets its own edge from the primary.
    expect(edges).toHaveLength(2)
    expect(new Set(edges.map((edge) => edge.id)).size).toBe(2)
  })

  it('keeps the healthy layout: gateway to primary, primary to each replica', () => {
    const { nodes, edges, layoutEdges } = generateHaNodesAndEdges(failoverTopology())
    const primary = nodes.find((node) => node.type === 'HA_PRIMARY')
    const replicaIds = nodes.filter((node) => node.type === 'HA_REPLICA').map((node) => node.id)

    expect(edges).toEqual(layoutEdges)
    expect(edges.filter((edge) => edge.source === 'multigateway')).toEqual([
      expect.objectContaining({ target: primary?.id, type: 'smoothstep' }),
    ])
    expect(edges.filter((edge) => edge.source === primary?.id).map((edge) => edge.target)).toEqual(
      replicaIds
    )
  })

  it('keeps the healthy layout while a replica is promoting', () => {
    const healthy = generateHaNodesAndEdges(failoverTopology())
    const { nodes, edges, layoutEdges } = generateHaNodesAndEdges(failoverTopology(), {
      failoverPhase: 'promoting',
    })
    const primary = nodes.find((node) => node.type === 'HA_PRIMARY')
    const promotingReplica = nodes.find((node) => node.data.promotion === 'promoting')
    const gatewayEdges = edges.filter((edge) => edge.source === 'multigateway')

    expect(primary?.data.statusOverride).toBe('unhealthy')
    expect(promotingReplica).toBeDefined()
    expect(nodes.some((node) => node.data.promotion === 'promoted')).toBe(false)
    expect(gatewayEdges).toEqual([
      expect.objectContaining({ target: primary?.id, type: 'smoothstep' }),
    ])
    expect(layoutEdges.map((edge) => `${edge.source}->${edge.target}`)).toEqual(
      healthy.layoutEdges.map((edge) => `${edge.source}->${edge.target}`)
    )
  })

  it('marks the primary unhealthy and routes the gateway to the promoted replica during failover', () => {
    const { nodes, edges, layoutEdges } = generateHaNodesAndEdges(failoverTopology(), {
      failoverPhase: 'failover',
    })
    const primary = nodes.find((node) => node.type === 'HA_PRIMARY')
    const promotedReplica = nodes.find(
      (node) => node.type === 'HA_REPLICA' && node.data.promotion === 'promoted'
    )
    const secondaryReplicas = nodes.filter(
      (node) => node.type === 'HA_REPLICA' && node.data.promotion !== 'promoted'
    )
    const gatewayEdges = edges.filter((edge) => edge.source === 'multigateway')
    const primaryEdges = edges.filter((edge) => edge.source === primary?.id)
    const promotedEdges = edges.filter((edge) => edge.source === promotedReplica?.id)
    const gatewayLayoutTargets = layoutEdges
      .filter((edge) => edge.source === 'multigateway')
      .map((edge) => edge.target)

    expect(primary?.data.statusOverride).toBe('unhealthy')
    expect(promotedReplica?.data.statusOverride).toBe('healthy')
    expect(gatewayEdges).toHaveLength(1)
    expect(gatewayEdges[0].target).toBe(promotedReplica?.id)
    expect(gatewayEdges.some((edge) => edge.target === primary?.id)).toBe(false)
    expect(gatewayEdges.every((edge) => edge.type === 'failover')).toBe(true)
    expect(primaryEdges).toHaveLength(0)
    expect(promotedEdges.map((edge) => edge.target)).toEqual(
      secondaryReplicas.map((node) => node.id)
    )
    expect(promotedEdges.every((edge) => edge.type === 'smoothstep')).toBe(true)
    expect(promotedEdges.every((edge) => edge.animated)).toBe(true)
    expect(promotedEdges.every((edge) => edge.style?.strokeDasharray === '3 5')).toBe(true)
    expect(gatewayLayoutTargets).toEqual(expect.arrayContaining([primary?.id, promotedReplica?.id]))
  })

  it('places the promoted replica on the primary row with remaining replicas below it', () => {
    const { nodes, layoutEdges } = generateHaNodesAndEdges(failoverTopology(), {
      failoverPhase: 'failover',
    })
    const { nodes: laidOut } = getDagreGraphLayout(nodes, layoutEdges, { ranksep: HA_RANKSEP })
    const primary = laidOut.find((node) => node.type === 'HA_PRIMARY')
    const promoted = laidOut.find(
      (node) => node.type === 'HA_REPLICA' && node.data.promotion === 'promoted'
    )
    const secondary = laidOut.find(
      (node) => node.type === 'HA_REPLICA' && node.data.promotion !== 'promoted'
    )

    expect(primary).toBeDefined()
    expect(promoted).toBeDefined()
    expect(secondary).toBeDefined()
    // Same rank: dagre centers nodes, and the replica card is shorter than the primary.
    expect(Math.abs((primary?.position.y ?? 0) - (promoted?.position.y ?? 0))).toBeLessThan(80)
    expect(secondary?.position.y ?? 0).toBeGreaterThan(promoted?.position.y ?? 0)
    expect(secondary?.position.y ?? 0).toBeGreaterThan(primary?.position.y ?? 0)
  })

  it('does not drop the failed primary below its laid-out row', () => {
    const { nodes, layoutEdges } = generateHaNodesAndEdges(failoverTopology(), {
      failoverPhase: 'failover',
    })
    const { nodes: laidOut } = getDagreGraphLayout(nodes, layoutEdges, { ranksep: HA_RANKSEP })
    const primary = laidOut.find((node) => node.type === 'HA_PRIMARY')
    const { nodes: groupedNodes } = addShardNodes(laidOut, [])
    const groupedPrimary = groupedNodes.find((node) => node.id === primary?.id)

    expect(groupedPrimary?.position.y).toBe(primary?.position.y)
  })
})
