import dagre from '@dagrejs/dagre'
import type { PostgresSchema, PostgresTable } from '@supabase/postgres-meta'
import { uniqBy } from 'lodash'
import { Edge, Node, Position } from 'reactflow'
import 'reactflow/dist/style.css'

import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { tryParseJson } from 'lib/helpers'
import { TABLE_NODE_ROW_HEIGHT, TABLE_NODE_WIDTH, TableNodeData } from './SchemaTableNode'

const NODE_SEP = 25
const RANK_SEP = 50

export async function getGraphDataFromTables(
  ref: string,
  schema: PostgresSchema,
  tables: PostgresTable[]
): Promise<{
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
        isUpdateable: column.is_updatable,
        isIdentity: column.is_identity,
      }
    })

    return {
      id: `${table.id}`,
      type: 'table',
      data: {
        ref,
        id: table.id,
        name: table.name,
        isForeign: false,
        columns,
      } as TableNodeData,
      position: { x: 0, y: 0 },
    }
  })

  const edges: Edge[] = []
  const currentSchema = tables[0].schema
  const uniqueRelationships = uniqBy(
    tables.flatMap((t) => t.relationships),
    'id'
  )

  for (const rel of uniqueRelationships) {
    // TODO: Support [external->this] relationship?
    if (rel.source_schema !== currentSchema) {
      continue
    }

    // Create additional [this->foreign] node that we can point to on the graph.
    if (rel.target_table_schema !== currentSchema) {
      nodes.push({
        id: rel.constraint_name,
        type: 'table',
        data: {
          ref,
          name: `${rel.target_table_schema}.${rel.target_table_name}.${rel.target_column_name}`,
          isForeign: true,
          columns: [],
        } as TableNodeData,
        position: { x: 0, y: 0 },
      })

      const [source, sourceHandle] = findTablesHandleIds(
        tables,
        rel.source_table_name,
        rel.source_column_name
      )

      if (source) {
        edges.push({
          id: String(rel.id),
          source,
          sourceHandle,
          target: rel.constraint_name,
          targetHandle: rel.constraint_name,
        })
      }

      continue
    }

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

  const savedPositionsLocalStorage = localStorage.getItem(
    LOCAL_STORAGE_KEYS.SCHEMA_VISUALIZER_POSITIONS(ref, schema.id)
  )
  const savedPositions = tryParseJson(savedPositionsLocalStorage)
  return !!savedPositions
    ? getLayoutedElementsViaLocalStorage(nodes, edges, savedPositions)
    : getLayoutedElementsViaDagre(nodes, edges)
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

export const getLayoutedElementsViaDagre = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: 'LR',
    align: 'UR',
    nodesep: NODE_SEP,
    ranksep: RANK_SEP,
  })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: TABLE_NODE_WIDTH / 2,
      height: (TABLE_NODE_ROW_HEIGHT / 2) * (node.data.columns.length + 1), // columns + header
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

const getLayoutedElementsViaLocalStorage = (
  nodes: Node[],
  edges: Edge[],
  positions: { [key: string]: { x: number; y: number } }
) => {
  // [Joshen] Potentially look into auto fitting new nodes?
  // https://github.com/xyflow/xyflow/issues/1113

  const nodesWithNoSavedPositons = nodes.filter((n) => !(n.id in positions))
  let newNodeCount = 0
  let basePosition = {
    x: 0,
    y: -(NODE_SEP + TABLE_NODE_ROW_HEIGHT + nodesWithNoSavedPositons.length * 10),
  }

  nodes.forEach((node) => {
    const existingPosition = positions?.[node.id]

    node.targetPosition = Position.Left
    node.sourcePosition = Position.Right

    if (existingPosition) {
      node.position = existingPosition
    } else {
      node.position = {
        x: basePosition.x + newNodeCount * 10,
        y: basePosition.y + newNodeCount * 10,
      }
      newNodeCount += 1
    }
  })
  return { nodes, edges }
}
