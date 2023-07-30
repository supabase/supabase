import dagre from '@dagrejs/dagre'
import clsx from 'clsx'
import { observer } from 'mobx-react-lite'
import { uniqBy } from 'lodash'
import { useEffect, useMemo } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Edge,
  Handle,
  Node,
  NodeProps,
  Position,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow'

import { PostgresTable } from '@supabase/postgres-meta'
import { useTheme } from 'common/Providers'
import { useStore } from 'hooks'
import { IconLoader } from 'ui'

import 'reactflow/dist/style.css'

type TableNodeData = {
  name: string
  isForeign: boolean
  columns: {
    id: string
    isPrimary: boolean
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

// ReactFlow is scaling everything by the factor of 2
const NODE_WIDTH = 320
const NODE_ROW_HEIGHT = 40

function TableNode({ data, targetPosition, sourcePosition }: NodeProps<TableNodeData>) {
  // Important styles is a nasty hack to use Handles (required for edges calculations), but do not show them in the UI.
  // ref: https://github.com/wbkd/react-flow/discussions/2698
  const hiddenNodeConnector = '!h-px !w-px !min-w-0 !min-h-0 !cursor-grab !border-0 !opacity-0'

  return (
    <>
      {data.isForeign ? (
        <div className="rounded-lg overflow-hidden">
          <header className="text-[0.5rem] leading-5 font-bold px-2 text-center bg-brand text-gray-300">
            {data.name}
            {targetPosition && (
              <Handle
                type="target"
                id={data.name}
                position={targetPosition}
                className={clsx(hiddenNodeConnector, '!left-0')}
              />
            )}
          </header>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ width: NODE_WIDTH / 2 }}>
          <header className="text-[0.5rem] leading-5 font-bold px-2 text-center bg-brand text-gray-300">
            {data.name}
          </header>

          {data.columns.map((column) => (
            <div
              className="text-[8px] leading-5 relative flex justify-between odd:bg-scale-300 even:bg-scale-400"
              key={column.id}
            >
              <span
                className={clsx(
                  column.isPrimary && 'border-l-2 border-l-brand pl-[6px] pr-2',
                  'pl-2 text-ellipsis overflow-hidden whitespace-nowrap'
                )}
              >
                {column.name}
              </span>
              <span
                className={clsx(
                  column.isPrimary && 'ml-[2px] pl-[6px]',
                  'absolute top-0 left-0 right-0 pl-2 bg-scale-500 text-ellipsis overflow-hidden whitespace-nowrap opacity-0 hover:opacity-100'
                )}
              >
                {column.name}
              </span>
              <span className="px-2">{column.format}</span>
              {targetPosition && (
                <Handle
                  type="target"
                  id={column.id}
                  position={targetPosition}
                  className={clsx(hiddenNodeConnector, '!left-0')}
                />
              )}
              {sourcePosition && (
                <Handle
                  type="source"
                  id={column.id}
                  position={sourcePosition}
                  className={clsx(hiddenNodeConnector, '!right-0')}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

const TablesGraph = ({ tables }: { tables: PostgresTable[] }) => {
  const { isDarkMode } = useTheme()
  const backgroundPatternColor = isDarkMode ? '#2e2e2e' : '#e6e8eb'
  const edgeStrokeColor = isDarkMode ? '#ededed' : '#111318'

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
  }, [tables, isDarkMode])

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
              stroke: edgeStrokeColor,
            },
          }}
          nodeTypes={nodeTypes}
          fitView
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={16} color={backgroundPatternColor} variant={BackgroundVariant.Lines} />
        </ReactFlow>
      </div>
    </>
  )
}

const SchemaGraph = ({ schema }: { schema: string }) => {
  const { meta } = useStore()
  const tables = meta.tables.list((table: { schema: string }) => table.schema === schema)

  if (meta.tables.isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center space-x-2">
        <IconLoader className="animate-spin" size={14} />
        <p className="text-sm text-scale-1000">Loading schemas...</p>
      </div>
    )
  }

  if (meta.tables.hasError) {
    return (
      <div className="px-6 py-4 text-scale-1000">
        <p>Error connecting to API</p>
        <p>{`${meta.tables.error?.message ?? 'Unknown error'}`}</p>
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <TablesGraph tables={tables} />
    </ReactFlowProvider>
  )
}

export default observer(SchemaGraph)
