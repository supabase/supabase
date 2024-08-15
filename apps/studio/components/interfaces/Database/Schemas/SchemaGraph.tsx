import dagre from '@dagrejs/dagre'
import type { PostgresTable } from '@supabase/postgres-meta'
import { uniqBy } from 'lodash'
import { useTheme } from 'next-themes'
import { useEffect, useMemo } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Edge,
  MiniMap,
  Node,
  Position,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useTablesQuery } from 'data/tables/tables-query'
import { IconLoader } from 'ui'
import { TABLE_NODE_ROW_HEIGHT, TABLE_NODE_WIDTH, TableNode } from 'ui-patterns/SchemaTableNode'
import SchemaGraphLegend from './SchemaGraphLegend'

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
    rankdir: 'LR',
    align: 'UR',
    nodesep: 25,
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

const TablesGraph = ({ tables }: { tables: PostgresTable[] }) => {
  const { resolvedTheme } = useTheme()
  const backgroundPatternColor = resolvedTheme?.includes('dark') ? '#2e2e2e' : '#e6e8eb'
  const edgeStrokeColor = resolvedTheme?.includes('dark') ? '#ededed' : '#111318'

  const miniMapNodeColor = '#111318'
  const miniMapMaskColor = resolvedTheme?.includes('dark')
    ? 'rgb(17, 19, 24, .8)'
    : 'rgb(237, 237, 237, .8)'

  const reactFlowInstance = useReactFlow()
  const nodeTypes = useMemo(
    () => ({
      table: TableNode,
    }),
    []
  )

  useEffect(() => {
    getGraphDataFromTables(tables).then(({ nodes, edges }) => {
      reactFlowInstance.setNodes(nodes)
      reactFlowInstance.setEdges(edges)
      setTimeout(() => reactFlowInstance.fitView({})) // it needs to happen during next event tick
    })
  }, [tables, resolvedTheme])

  return (
    <>
      <div className="w-full h-full">
        <ReactFlow
          defaultNodes={[]}
          defaultEdges={[]}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            deletable: false,
            style: {
              stroke: 'hsl(var(--border-stronger))',
              strokeWidth: 0.5,
            },
          }}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.8}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            gap={16}
            className="[&>*]:stroke-foreground-muted opacity-[25%]"
            variant={BackgroundVariant.Dots}
            color={'inherit'}
          />
          <MiniMap
            pannable
            zoomable
            nodeColor={miniMapNodeColor}
            maskColor={miniMapMaskColor}
            className="border rounded-md shadow-sm"
          />
          <SchemaGraphLegend />
        </ReactFlow>
      </div>
    </>
  )
}

const SchemaGraph = ({ schema }: { schema: string }) => {
  const { project } = useProjectContext()
  const {
    data: tables,
    isLoading,
    isError,
    error,
  } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema,
    includeColumns: true,
  })

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center space-x-2">
        <IconLoader className="animate-spin" size={14} />
        <p className="text-sm text-foreground-light">Loading table...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="px-6 py-4 text-foreground-light">
        <p>Error connecting to API</p>
        <p>{`${error?.message ?? 'Unknown error'}`}</p>
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <TablesGraph tables={tables} />
    </ReactFlowProvider>
  )
}

export default SchemaGraph
