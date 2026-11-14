import { describe, expect, it } from 'vitest'

import { generateHaNodesAndEdges } from './HaInstanceConfiguration.utils'
import { buildHaTopology, selectTopologyPoolers } from './HaTopology.utils'
import { haClusterPoolersResponseSchema } from '@/data/ha-admin/ha-cluster-poolers-query'

describe('generateHaNodesAndEdges', () => {
  it.each(['shardRef', 'shardKey', 'mixed', 'both'])(
    'preserves shard groups and primary/replica nodes through the %s response pipeline',
    (format) => {
      const poolers = ['0', '1'].flatMap((shard) =>
        ['PRIMARY', 'REPLICA'].map((role, index) => {
          const shardRef = { database: 'postgres', tableGroup: 'default', shard }
          const usesLegacyKey = format === 'shardKey' || (format === 'mixed' && index === 1)
          return {
            id: { cell: `cell-${index}`, name: `p-${shard}-${role}` },
            ...(usesLegacyKey ? { shardKey: shardRef } : { shardRef }),
            ...(format === 'both' ? { shardKey: { ...shardRef, shard: 'stale' } } : {}),
            routingState: { role: `ROUTING_ROLE_${role}` },
          }
        })
      )
      const data = haClusterPoolersResponseSchema.parse({ poolers })
      const topology = buildHaTopology({ gateways: [], poolers: selectTopologyPoolers(data) })

      expect(topology.shards.map(({ id, name }) => ({ id, name }))).toEqual([
        { id: 'postgres/default/0', name: 'Shard 1' },
        { id: 'postgres/default/1', name: 'Shard 2' },
      ])
      const { nodes, edges } = generateHaNodesAndEdges(topology)
      for (const shard of ['0', '1']) {
        expect(nodes.filter((node) => node.data.shardId === `postgres/default/${shard}`)).toEqual([
          expect.objectContaining({
            type: 'HA_PRIMARY',
            data: expect.objectContaining({ name: `p-${shard}-PRIMARY` }),
          }),
          expect.objectContaining({
            type: 'HA_REPLICA',
            data: expect.objectContaining({ name: `p-${shard}-REPLICA` }),
          }),
        ])
        expect(edges).toContainEqual(
          expect.objectContaining({
            source: `pooler-cell-0-p-${shard}-PRIMARY`,
            target: `pooler-cell-1-p-${shard}-REPLICA`,
          })
        )
      }
      expect(edges).toHaveLength(2)
    }
  )

  it('gives every pooler a unique node id even when identities are omitted', () => {
    const topology = buildHaTopology({
      gateways: [],
      poolers: [
        {
          id: { cell: 'cell-1', name: 'p-1' },
          shardRef: { shard: '0' },
          routingState: { role: 'ROUTING_ROLE_PRIMARY' },
        },
        { shardRef: { shard: '0' }, routingState: { role: 'ROUTING_ROLE_REPLICA' } },
        { shardRef: { shard: '0' }, routingState: { role: 'ROUTING_ROLE_REPLICA' } },
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
