import dagre from '@dagrejs/dagre'
import ELK from 'elkjs/lib/elk.bundled.js'
import { Edge, Node, Position } from 'reactflow'
import { groupBy } from 'lodash'

import { NODE_ROW_HEIGHT, NODE_WIDTH } from '../Infrastructure.constants'
import { AVAILABLE_REPLICA_REGIONS, DatabaseConfiguration } from './InstanceConfiguration.constants'

export const generateNodes = (
  databases: DatabaseConfiguration[],
  {
    onSelectRestartReplica,
    onSelectResizeReplica,
    onSelectDropReplica,
  }: {
    onSelectRestartReplica: (database: DatabaseConfiguration) => void
    onSelectResizeReplica: (database: DatabaseConfiguration) => void
    onSelectDropReplica: (database: DatabaseConfiguration) => void
  }
): Node[] => {
  const position = { x: 0, y: 0 }
  // const regions = Object.keys(groupBy(databases, 'region'))

  // const regionNodes: Node[] = regions.map((region) => {
  //   const regionMeta = AVAILABLE_REPLICA_REGIONS.find((r) => region.includes(r.region))

  //   return {
  //     position,
  //     id: regionMeta?.key ?? '',
  //     type: 'REGION',
  //     data: {
  //       label: regionMeta?.name,
  //       region: regionMeta?.region,
  //     },
  //   }
  // })

  const databaseNodes: Node[] = databases
    .sort((a, b) => (a.region > b.region ? 1 : -1))
    .map((database) => {
      const region = AVAILABLE_REPLICA_REGIONS.find((region) =>
        database.region.includes(region.region)
      )

      return {
        position,
        id: `database-${database.id}`,
        type: database.type,
        data: {
          label: database.type === 'PRIMARY' ? 'Primary Database' : 'Read Replica',
          provider: database.cloud_provider,
          region: database.region,
          regionKey: region?.key,
          inserted_at: database.inserted_at,
          ...(database.type === 'READ_REPLICA'
            ? {
                onSelectRestartReplica: () => onSelectRestartReplica(database),
                onSelectResizeReplica: () => onSelectResizeReplica(database),
                onSelectDropReplica: () => onSelectDropReplica(database),
              }
            : {}),
        },
      }
    })

  return [...databaseNodes]
}

// Before we completely move to Elk as the layout engine, let's sketch it out first
export const getGraphLayout = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: 'TB', ranksep: 130, nodesep: 10 })

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
