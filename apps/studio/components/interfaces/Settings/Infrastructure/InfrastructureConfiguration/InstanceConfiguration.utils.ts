import dagre from '@dagrejs/dagre'
import { Edge, Node, Position } from 'reactflow'

import {
  AVAILABLE_REPLICA_REGIONS,
  NODE_ROW_HEIGHT,
  NODE_SEP,
  NODE_WIDTH,
} from './InstanceConfiguration.constants'
import { groupBy } from 'lodash'
import { Database } from 'data/read-replicas/replicas-query'

export const generateNodes = (
  primary: Database,
  replicas: Database[],
  {
    onSelectRestartReplica,
    onSelectResizeReplica,
    onSelectDropReplica,
  }: {
    onSelectRestartReplica: (database: Database) => void
    onSelectResizeReplica: (database: Database) => void
    onSelectDropReplica: (database: Database) => void
  }
): Node[] => {
  const position = { x: 0, y: 0 }
  const regions = groupBy(replicas, (d) => {
    const region = AVAILABLE_REPLICA_REGIONS.find((region) => d.region.includes(region.region))
    return region?.key
  })

  const primaryRegion = AVAILABLE_REPLICA_REGIONS.find((region) =>
    primary.region.includes(region.region)
  )
  const primaryNode: Node = {
    position,
    id: primary.identifier,
    type: 'PRIMARY',
    data: {
      id: primary.identifier,
      region: primaryRegion,
      provider: primary.cloud_provider,
      inserted_at: primary.inserted_at,
      computeSize: primary.size,
      status: primary.status,
      numReplicas: replicas.length,
      numRegions: Object.keys(regions).length,
    },
  }

  const replicaNodes: Node[] = replicas
    .sort((a, b) => (a.region > b.region ? 1 : -1))
    .map((database) => {
      const region = AVAILABLE_REPLICA_REGIONS.find((region) =>
        database.region.includes(region.region)
      )

      return {
        position,
        id: database.identifier,
        type: 'READ_REPLICA',
        data: {
          id: database.identifier,
          region,
          provider: database.cloud_provider,
          inserted_at: database.inserted_at,
          computeSize: database.size,
          status: database.status,
          onSelectRestartReplica: () => onSelectRestartReplica(database),
          onSelectResizeReplica: () => onSelectResizeReplica(database),
          onSelectDropReplica: () => onSelectDropReplica(database),
        },
      }
    })

  return [primaryNode, ...replicaNodes]
}

export const getDagreGraphLayout = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 200, nodesep: NODE_SEP })

  nodes.forEach((node) =>
    dagreGraph.setNode(node.id, { width: NODE_WIDTH / 2, height: NODE_ROW_HEIGHT / 2 })
  )

  edges.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target))

  dagre.layout(dagreGraph)

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.targetPosition = Position.Top
    node.sourcePosition = Position.Bottom
    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWithPosition.width / 2,
      y: nodeWithPosition.y - nodeWithPosition.height / 2,
    }

    return node
  })

  return { nodes, edges }
}

/**
 * [Joshen] This is some customized logic to add region nodes as "subflow" as dagre doesn't support
 * subflows, and I didn't want to go down a rabbit hole with the other layout libraries that react-flow
 * supports. Definitely some things to improve in the future
 * - Allow setting max number of nodes per row, so that the chart does not become too horizontally sparse
 *   when many many replicas created
 * - Nodes are a bit too spaced out between each other within a region
 */
export const addRegionNodes = (nodes: Node[], edges: Edge[]) => {
  const regionNodes: Node[] = []
  const replicaNodes = nodes.filter((node) => node.type === 'READ_REPLICA')

  const nodesByRegion = groupBy(replicaNodes, (node) => node.data.region.key)
  Object.entries(nodesByRegion).map(([key, value]) => {
    const region = AVAILABLE_REPLICA_REGIONS.find((r) => r.key === key)
    const nodeXPositions = value.map((x) => x.position.x)
    const nodeYPositions = value.map((x) => x.position.y)

    const minX = Math.min(...nodeXPositions)
    const maxX = Math.max(...nodeXPositions)

    const minY = Math.max(...nodeYPositions)

    const regionNode: Node = {
      id: key,
      position: { x: minX - 10, y: minY - 10 },
      width: maxX - minX + NODE_WIDTH / 2,
      type: 'REGION',
      data: { region, numReplicas: value.length },
    }
    regionNodes.push(regionNode)
  })

  return { nodes: [...regionNodes, ...nodes], edges }
}
