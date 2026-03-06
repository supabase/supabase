import dagre from '@dagrejs/dagre'
import { groupBy } from 'lodash'
import { Edge, Node, Position } from 'reactflow'

import type { LoadBalancer } from 'data/read-replicas/load-balancers-query'
import type { Database } from 'data/read-replicas/replicas-query'
import { AWS_REGIONS, AWS_REGIONS_KEYS } from 'shared-data'
import {
  AVAILABLE_REPLICA_REGIONS,
  AWS_REGIONS_COORDINATES,
  NODE_ROW_HEIGHT,
  NODE_SEP,
  NODE_WIDTH,
} from './InstanceConfiguration.constants'

// [Joshen] Just FYI the nodes generation assumes each project only has one load balancer
// Will need to change if this eventually becomes otherwise

export const generateNodes = ({
  primary,
  replicas,
  loadBalancers,
  onSelectRestartReplica,
  onSelectDropReplica,
}: {
  primary: Database
  replicas: Database[]
  loadBalancers: LoadBalancer[]
  onSelectRestartReplica: (database: Database) => void
  onSelectDropReplica: (database: Database) => void
}): Node[] => {
  const position = { x: 0, y: 0 }
  const regions = groupBy(replicas, (d) => {
    const region = AVAILABLE_REPLICA_REGIONS.find((region) => d.region.includes(region.region))
    return region?.key
  })

  const loadBalancer = loadBalancers.find((x) =>
    x.databases.some((db) => db.identifier === primary.identifier)
  )
  const loadBalancerNode: Node | undefined =
    loadBalancer !== undefined
      ? {
          position,
          id: 'load-balancer',
          type: 'LOAD_BALANCER',
          data: {
            numDatabases: loadBalancer.databases.length,
          },
        }
      : undefined

  // [Joshen] We should be finding from AVAILABLE_REPLICA_REGIONS instead
  // but because the new regions (zurich, stockholm, ohio, paris) dont have
  // coordinates yet in AWS_REGIONS_COORDINATES - we'll need to add them in once
  // they are ready to spin up coordinates for
  const primaryRegion = Object.keys(AWS_REGIONS)
    .map((key) => {
      return {
        key: key as AWS_REGIONS_KEYS,
        name: AWS_REGIONS?.[key as AWS_REGIONS_KEYS].displayName,
        region: AWS_REGIONS?.[key as AWS_REGIONS_KEYS].code,
        coordinates: AWS_REGIONS_COORDINATES[key],
      }
    })
    .find((region) => primary.region.includes(region.region))

  // [Joshen] Once we have the coordinates for Zurich and Stockholm, we can remove the above
  // and uncomment below for better simplicity
  // const primaryRegion = AVAILABLE_REPLICA_REGIONS.find((region) =>
  //   primary.region.includes(region.region)
  // )

  const primaryNode: Node = {
    position,
    id: primary.identifier,
    type: 'PRIMARY',
    data: {
      id: primary.identifier,
      region:
        primary.cloud_provider === 'FLY'
          ? { name: 'Singapore (sin)', key: 'SOUTHEAST_ASIA' }
          : primaryRegion ?? { name: primary.region },
      provider: primary.cloud_provider,
      inserted_at: primary.inserted_at,
      computeSize: primary.size,
      status: primary.status,
      numReplicas: replicas.length,
      numRegions: Object.keys(regions).length,
      hasLoadBalancer: loadBalancer !== undefined,
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
          onSelectDropReplica: () => onSelectDropReplica(database),
        },
      }
    })

  return [
    ...(loadBalancerNode !== undefined ? [loadBalancerNode] : []),
    primaryNode,
    ...replicaNodes,
  ]
}

export const getDagreGraphLayout = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 160, nodesep: NODE_SEP })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: NODE_WIDTH / 2,
      height: node.id === 'load-balancer' ? -70 : NODE_ROW_HEIGHT / 2,
    })
  })

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

export const formatSeconds = (value: number) => {
  const hours = ~~(value / 3600)
  const minutes = Math.floor((value % 3600) / 60)
  const seconds = Math.floor(value % 60)

  return `${hours > 0 ? `${hours}h` : ''} ${minutes > 0 ? `${minutes}m` : ''} ${seconds > 0 ? `${seconds}s` : ''}`.trim()
}
