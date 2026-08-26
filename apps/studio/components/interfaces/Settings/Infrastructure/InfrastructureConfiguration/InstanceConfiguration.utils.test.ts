import { Edge, Node } from '@xyflow/react'
import { describe, expect, it } from 'vitest'

import { NODE_HEIGHT_FALLBACKS } from './InstanceConfiguration.constants'
import { getDagreGraphLayout } from './InstanceConfiguration.utils'

const makeNodes = (): Node[] => [
  { id: 'primary', position: { x: 0, y: 0 }, data: {}, type: 'PRIMARY' },
  { id: 'replica', position: { x: 0, y: 0 }, data: {}, type: 'READ_REPLICA' },
]

const edges: Edge[] = [{ id: 'primary-replica', source: 'primary', target: 'replica' }]

// Vertical gap between a node's bottom edge and the next rank's top edge.
const getRankGap = (nodes: Node[]) =>
  nodes[1].position.y - (nodes[0].position.y + NODE_HEIGHT_FALLBACKS.PRIMARY)

describe('getDagreGraphLayout', () => {
  it('separates ranks by the default ranksep', () => {
    const { nodes } = getDagreGraphLayout(makeNodes(), edges)
    expect(getRankGap(nodes)).toBe(60)
  })

  it('separates ranks by a custom ranksep', () => {
    const { nodes } = getDagreGraphLayout(makeNodes(), edges, { ranksep: 96 })
    expect(getRankGap(nodes)).toBe(96)
  })
})
