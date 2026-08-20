import { Edge, Node } from '@xyflow/react'
import { groupBy } from 'lodash'

import { getPoolerKey, HaTopology } from './HaTopology.utils'
import {
  NODE_HEIGHT_FALLBACKS,
  NODE_WIDTH,
  SHARD_HEADER_HEIGHT,
  SHARD_NODE_PADDING,
} from './InstanceConfiguration.constants'

export type MultigatewayNodeData = {
  numGateways: number
}

export type HaPoolerNodeData = {
  cell?: string
  name?: string
  shardId: string
  shardName: string
  // Only set on primary nodes; hides the unused top handle when no gateway exists.
  hasGateway?: boolean
}

export type HaShardNodeData = {
  name: string
  numNodes: number
  width: number
  height: number
}

export type HaReplicationEdgeData = {
  cell?: string
  name?: string
}

export const generateHaNodesAndEdges = (topology: HaTopology): { nodes: Node[]; edges: Edge[] } => {
  const position = { x: 0, y: 0 }
  const nodes: Node[] = []
  const edges: Edge[] = []

  // The alpha runs one multigateway per cell; the diagram collapses them into a
  // single gateway node with a count rather than rendering one card per cell.
  const hasGateway = topology.gateways.length > 0
  if (hasGateway) {
    nodes.push({
      position,
      id: 'multigateway',
      type: 'HA_GATEWAY',
      data: { numGateways: topology.gateways.length } satisfies MultigatewayNodeData,
    })
  }

  topology.shards.forEach((shard) => {
    const primaryId =
      shard.primary !== undefined ? `pooler-${getPoolerKey(shard.primary)}` : undefined

    if (shard.primary !== undefined && primaryId !== undefined) {
      nodes.push({
        position,
        id: primaryId,
        type: 'HA_PRIMARY',
        data: {
          cell: shard.primary.id?.cell,
          name: shard.primary.id?.name,
          shardId: shard.id,
          shardName: shard.name,
          hasGateway,
        } satisfies HaPoolerNodeData,
      })

      if (hasGateway) {
        edges.push({
          id: `multigateway-${primaryId}`,
          source: 'multigateway',
          target: primaryId,
          type: 'smoothstep',
          className: 'cursor-default!',
        })
      }
    }

    shard.replicas.forEach((replica) => {
      const replicaId = `pooler-${getPoolerKey(replica)}`
      nodes.push({
        position,
        id: replicaId,
        type: 'HA_REPLICA',
        data: {
          cell: replica.id?.cell,
          name: replica.id?.name,
          shardId: shard.id,
          shardName: shard.name,
        } satisfies HaPoolerNodeData,
      })

      if (primaryId !== undefined) {
        edges.push({
          id: `${primaryId}-${replicaId}`,
          source: primaryId,
          target: replicaId,
          type: 'HA_REPLICATION',
          className: 'cursor-default!',
          data: {
            cell: replica.id?.cell,
            name: replica.id?.name,
          } satisfies HaReplicationEdgeData,
        })
      }
    })
  })

  return { nodes, edges }
}

const getNodeWidth = (node: Node) => node.measured?.width ?? NODE_WIDTH / 2 - 10

const getNodeHeight = (node: Node) =>
  node.measured?.height ?? NODE_HEIGHT_FALLBACKS[node.type ?? ''] ?? 100

/**
 * Prepends a background group node per shard wrapping its primary + replicas,
 * using the same fake-subflow trick as `addRegionNodes` (dagre has no subflow
 * support, so the box is sized from the laid-out children's bounding box).
 */
export const addShardNodes = (nodes: Node[], edges: Edge[]) => {
  const shardNodes: Node[] = []
  const poolerNodes = nodes.filter(
    (node) => node.type === 'HA_PRIMARY' || node.type === 'HA_REPLICA'
  ) as Node<HaPoolerNodeData>[]

  const nodesByShard = groupBy(poolerNodes, (node) => node.data.shardId)
  Object.entries(nodesByShard).forEach(([shardId, children]) => {
    const minX = Math.min(...children.map((node) => node.position.x))
    const maxX = Math.max(...children.map((node) => node.position.x + getNodeWidth(node)))
    const minY = Math.min(...children.map((node) => node.position.y))
    const maxY = Math.max(...children.map((node) => node.position.y + getNodeHeight(node)))

    const width = maxX - minX + SHARD_NODE_PADDING * 2
    const height = maxY - minY + SHARD_HEADER_HEIGHT + SHARD_NODE_PADDING * 2

    shardNodes.push({
      id: `shard-${shardId}`,
      position: {
        x: minX - SHARD_NODE_PADDING,
        y: minY - SHARD_HEADER_HEIGHT - SHARD_NODE_PADDING,
      },
      // Explicit dimensions so React Flow renders the node immediately —
      // without them a node stays `visibility: hidden` until a measurement
      // pass that this post-layout background node never gets.
      width,
      height,
      // The box covers most of the canvas; making it non-interactive lets
      // React Flow drop its pointer events so drag-to-pan passes through to
      // the pane. The header pill re-enables pointer events for its tooltip.
      selectable: false,
      focusable: false,
      type: 'HA_SHARD',
      data: {
        name: children[0].data.shardName,
        numNodes: children.length,
        width,
        height,
      } satisfies HaShardNodeData,
    })
  })

  return { nodes: [...shardNodes, ...nodes], edges }
}
