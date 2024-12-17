import { PGlite } from '@electric-sql/pglite'
import { PostgresMetaBase, PostgresTable, wrapError, wrapResult } from '@gregnr/postgres-meta/base'
import dagre from '@dagrejs/dagre'
import { Edge, Node, Position, ReactFlowProvider } from 'reactflow'
import { useEffect, useRef, useState } from 'react'
import { SchemaFlow } from 'components/interfaces/ProjectCreation/design/SchemaFlow'

export const TABLE_NODE_WIDTH = 640
export const TABLE_NODE_ROW_HEIGHT = 80

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

interface SchemaVisualizerProps {
  sqlStatements: string[]
  className?: string
}

export const SchemaVisualizer = ({ sqlStatements, className }: SchemaVisualizerProps) => {
  const [nodes, setNodes] = useState<Node<TableNodeData>[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const db = useRef<PGlite>()
  const executedStatements = useRef<Set<string>>(new Set())

  // Initialize database once
  useEffect(() => {
    db.current = new PGlite()

    // Execute initial auth schema setup
    db.current.exec(`
      CREATE SCHEMA auth;
      CREATE TABLE auth.users (
          instance_id uuid,
          id uuid NOT NULL,
          aud character varying(255),
          role character varying(255),
          email character varying(255),
          encrypted_password character varying(255),
          confirmed_at timestamp with time zone,
          invited_at timestamp with time zone,
          confirmation_token character varying(255),
          confirmation_sent_at timestamp with time zone,
          recovery_token character varying(255),
          recovery_sent_at timestamp with time zone,
          email_change_token character varying(255),
          email_change character varying(255),
          email_change_sent_at timestamp with time zone,
          last_sign_in_at timestamp with time zone,
          raw_app_meta_data jsonb,
          raw_user_meta_data jsonb,
          is_super_admin boolean,
          created_at timestamp with time zone,
          updated_at timestamp with time zone
      );
      ALTER TABLE ONLY auth.users
      ADD CONSTRAINT users_email_key UNIQUE (email);
      ALTER TABLE ONLY auth.users
      ADD CONSTRAINT users_pkey PRIMARY KEY (id);
    `)
  }, [])

  // Execute new SQL statements and update schema
  useEffect(() => {
    const updateSchema = async () => {
      if (!db.current) return

      // Execute only new statements
      const newStatements = sqlStatements.filter((sql) => !executedStatements.current.has(sql))

      if (newStatements.length === 0) return

      try {
        for (const sql of newStatements) {
          await db.current.exec(sql)
          executedStatements.current.add(sql)
        }

        const pgMeta = new PostgresMetaBase({
          query: async (sql: string) => {
            try {
              const res = await db.current?.query(sql)
              return wrapResult<any[]>(res.rows)
            } catch (error) {
              console.error('Query failed:', error)
              return wrapError(error, sql)
            }
          },
          end: async () => {},
        })

        const { data: tables, error } = await pgMeta.tables.list({
          includedSchemas: ['public'],
          includeColumns: true,
        })

        if (error) {
          console.error('Failed to get tables:', error)
          return
        }

        if (tables) {
          const graphData = await getGraphDataFromTables(tables)
          setNodes(graphData.nodes)
          setEdges(graphData.edges)
        }
      } catch (error) {
        console.error('Failed to execute SQL:', error)
      }
    }

    updateSchema()
  }, [sqlStatements])

  return (
    <div className={className}>
      <ReactFlowProvider>
        <SchemaFlow nodes={nodes} edges={edges} />
      </ReactFlowProvider>
    </div>
  )
}

// Helper functions

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((val, index) => val === b[index])
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
      .map((column) => ({
        id: column.id,
        isPrimary: table.primary_keys.some((pk) => pk.name === column.name),
        name: column.name,
        format: column.format,
        isNullable: column.is_nullable,
        isUnique: column.is_unique,
        isUpdateable: column.is_updatable,
        isIdentity: column.is_identity,
      }))

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

  const edges = generateEdges(tables)
  return layoutElements(nodes, edges)
}

function generateEdges(tables: PostgresTable[]): Edge[] {
  const edges: Edge[] = []
  const currentSchema = tables[0].schema
  const uniqueRelationships = uniqBy(
    tables.flatMap((t) => t.relationships),
    'id'
  )

  for (const rel of uniqueRelationships) {
    if (rel.source_schema !== currentSchema) {
      continue
    }

    if (rel.target_table_schema !== currentSchema) {
      edges.push({
        id: rel.constraint_name,
        type: 'table',
        source: findTablesHandleIds(tables, rel.source_table_name, rel.source_column_name)[0] || '',
        sourceHandle: findTablesHandleIds(tables, rel.source_table_name, rel.source_column_name)[1],
        target: rel.constraint_name,
        targetHandle: rel.constraint_name,
      })
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

  return edges
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

function layoutElements(nodes: Node[], edges: Edge[]) {
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
      height: (TABLE_NODE_ROW_HEIGHT / 2) * (node.data.columns.length + 1),
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
    node.position = {
      x: nodeWithPosition.x - nodeWithPosition.width / 2,
      y: nodeWithPosition.y - nodeWithPosition.height / 2,
    }
  })

  return { nodes, edges }
}

function uniqBy<T>(arr: T[], key: keyof T): T[] {
  return Array.from(new Map(arr.map((item) => [item[key], item])).values())
}
