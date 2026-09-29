import { describe, expect, it } from 'vitest'

import { generateHaNodesAndEdges } from './HaInstanceConfiguration.utils'
import { buildHaTopology } from './HaTopology.utils'

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
})
