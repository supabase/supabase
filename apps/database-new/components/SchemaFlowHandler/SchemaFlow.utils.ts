import { PostgresTable } from '@/lib/types'
import dagre from '@dagrejs/dagre'
import { uniqBy } from 'lodash'
import { Edge, Node, Position } from 'reactflow'
import { TableNodeData } from 'ui-patterns/SchemaTableNode'

import { NODE_ROW_HEIGHT, NODE_WIDTH } from './SchemaFlow.constants'

export async function getGraphDataFromTables(tables: PostgresTable[]): Promise<{
  nodes: Node<TableNodeData>[]
  edges: Edge[]
}> {
  if (!tables.length) {
    return { nodes: [], edges: [] }
  }

  const nodes = tables.map((table) => {
    const columns = (table.columns || []).map((column) => {
      return {
        id: column.id,
        isPrimary: table.primary_keys.some((pk) => pk.name === column.name),
        name: column.name,
        format: column.format,
        isNullable: column.is_nullable,
        isUnique: column.is_unique,
        isIdentity: column.is_identity,
      }
    })

    return {
      id: `${table.id}`,
      type: 'table',
      data: {
        name: table.name,
        isForeign: false,
        columns,
      },
      position: { x: 0, y: 0 },
    }
  })

  const edges: Edge[] = []
  // const currentSchema = tables[0].schema
  const uniqueRelationships = uniqBy(
    tables.flatMap((t) => t.relationships),
    'id'
  )

  for (const rel of uniqueRelationships) {
    // TODO: Support [external->this] relationship?
    // if (rel.source_schema !== currentSchema) {
    //   continue
    // }

    // Create additional [this->foreign] node that we can point to on the graph.
    // if (rel.target_table_schema !== currentSchema) {
    //   nodes.push({
    //     id: rel.constraint_name,
    //     type: 'table',
    //     data: {
    //       name: `${rel.target_table_schema}.${rel.target_table_name}.${rel.target_column_name}`,
    //       isForeign: true,
    //       columns: [],
    //     },
    //     position: { x: 0, y: 0 },
    //   })

    //   const [source, sourceHandle] = findTablesHandleIds(
    //     tables,
    //     rel.source_table_name,
    //     rel.source_column_name
    //   )

    //   if (source) {
    //     edges.push({
    //       id: String(rel.id),
    //       source,
    //       sourceHandle,
    //       target: rel.constraint_name,
    //       targetHandle: rel.constraint_name,
    //     })
    //   }

    //   continue
    // }

    const [source, sourceHandle] = findTablesHandleIds(
      tables,
      rel.source_table_name,
      rel.source_column_name
    )
    const [target, targetHandle] = findTablesHandleIds(
      tables,
      rel.target_table_name,
      rel.target_column_name
    )

    // We do not support [external->this] flow currently.
    if (source && target) {
      edges.push({
        id: String(rel.id),
        source,
        sourceHandle,
        target,
        targetHandle,
      })
    }
  }

  return getLayoutedElements(nodes, edges)
}

function findTablesHandleIds(
  tables: PostgresTable[],
  table_name: string,
  column_name: string
): [string?, string?] {
  for (const table of tables) {
    if (table_name !== table.name) continue

    for (const column of table.columns || []) {
      if (column_name !== column.name) continue

      return [String(table.id), column.id]
    }
  }

  return []
}

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: 'TB',
    align: 'UR',
    nodesep: 25,
    ranksep: 50,
  })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: NODE_WIDTH / 2,
      height: (NODE_ROW_HEIGHT / 2) * (node.data.columns.length + 1), // columns + header
    })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.targetPosition = Position.Left
    node.sourcePosition = Position.Right
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
