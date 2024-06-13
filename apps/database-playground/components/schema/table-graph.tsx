import dagre from '@dagrejs/dagre'
import { PostgresTable } from '@supabase/postgres-meta'
import { uniqBy } from 'lodash'
import { useTheme } from 'next-themes'
import { useEffect, useMemo } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Edge,
  Node,
  Position,
  useReactFlow,
} from 'reactflow'
import SchemaGraphLegend from './legend'
import { TABLE_NODE_ROW_HEIGHT, TABLE_NODE_WIDTH, TableEdge, TableNode } from './table-node'

export default function TablesGraph({ tables }: { tables: PostgresTable[] }) {
  const { resolvedTheme } = useTheme()

  const reactFlowInstance = useReactFlow<TableNodeData>()
  const nodeTypes = useMemo(
    () => ({
      table: TableNode,
    }),
    []
  )
  const edgeTypes = useMemo(
    () => ({
      table: TableEdge,
    }),
    []
  )

  useEffect(() => {
    getGraphDataFromTables(tables).then(({ nodes, edges }) => {
      reactFlowInstance.setNodes(nodes)
      reactFlowInstance.setEdges(edges)

      // it needs to happen during next event tick
      setTimeout(
        () =>
          reactFlowInstance.fitView({
            padding: 0.4,
            duration: 500,
          }),
        100
      )
    })
  }, [reactFlowInstance, tables, resolvedTheme])

  return (
    <ReactFlow
      className="bg-neutral-800 rounded-md border-[0.5px] border-neutral-800 overflow-hidden"
      defaultNodes={[]}
      defaultEdges={[]}
      defaultEdgeOptions={{
        type: 'smoothstep',
        deletable: false,
        style: {
          stroke: 'hsl(var(--border-stronger))',
          strokeWidth: 1,
          strokeDasharray: 5,
          // Manually create animation so that it doesn't interfere with our custom edge component
          animation: 'dashdraw 0.5s linear infinite',
        },
      }}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      minZoom={0.8}
      maxZoom={1.8}
      proOptions={{ hideAttribution: true }}
      onInit={(flow) => {
        // Call `fitView` imperatively in order to set padding
        flow.fitView({
          padding: 0.4,
        })
      }}
    >
      <Background
        gap={16}
        className="text-neutral-500 bg-neutral-800"
        variant={BackgroundVariant.Dots}
        color="currentColor"
      />
      <SchemaGraphLegend />
    </ReactFlow>
  )
}

type TableNodeData = {
  name: string
  isForeign: boolean
  columns: {
    id: string
    isPrimary: boolean
    isNullable: boolean
    isUnique: boolean
    isUpdateable: boolean
    isIdentity: boolean
    name: string
    format: string
  }[]
}

async function getGraphDataFromTables(tables: PostgresTable[]): Promise<{
  nodes: Node<TableNodeData>[]
  edges: Edge[]
}> {
  if (!tables.length) {
    return { nodes: [], edges: [] }
  }

  const nodes = tables.map((table) => {
    const columns = (table.columns || [])
      .sort((a, b) => a.ordinal_position - b.ordinal_position)
      .map((column) => {
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
        name: table.name,
        isForeign: false,
        columns,
      },
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
          name: `${rel.target_table_schema}.${rel.target_table_name}.${rel.target_column_name}`,
          isForeign: true,
          columns: [],
        },
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
          type: 'table',
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
        type: 'table',
        source,
        sourceHandle,
        target,
        targetHandle,
      })
    }
  }

  return layoutElements(nodes, edges)
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

/**
 * Positions nodes relative to each other on the graph using `dagre`.
 */
const layoutElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: 'LR',
    align: 'UR',
    nodesep: 50,
    ranksep: 50,
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
