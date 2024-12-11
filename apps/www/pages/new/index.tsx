import { useChat } from 'ai/react'
import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Box,
  Clock,
  ListOrdered,
  Database,
  Ic,
  Zapon,
  KeyRound,
  Square,
  Zap,
  Image,
  File,
  User2,
  FileX2,
} from 'lucide-react'
import {
  Button,
  Input,
  Tooltip_Shadcn_,
  TooltipContent_Shadcn_,
  TooltipProvider_Shadcn_,
  TooltipTrigger_Shadcn_,
} from 'ui'
import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import dagre from '@dagrejs/dagre'
import { uniqBy } from 'lodash'
import { AiIconAnimation, cn, CodeBlock } from 'ui'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  MiniMap,
  Node,
  Position,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useStore,
  ReactFlowProvider,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { TableNode } from './TableNode'
import { PGlite } from '@electric-sql/pglite'
import {
  PostgresMetaBase,
  PostgresMetaErr,
  PostgresTable,
  wrapError,
  wrapResult,
} from '@gregnr/postgres-meta/base'
import { SchemaFlow } from './SchemaFlow'
const NODE_SEP = 25
const RANK_SEP = 50

export const TABLE_NODE_WIDTH = 640
export const TABLE_NODE_ROW_HEIGHT = 80

interface MessageProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  isLoading?: boolean
}

function Message({ role, content, isLoading }: MessageProps) {
  const isUser = role === 'user'

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn('mb-4 text-sm', isUser ? 'text-foreground' : 'text-foreground-light')}
    >
      <div className="flex gap-4 w-auto overflow-hidden">
        {isUser ? (
          <figure className="w-5 h-5 shrink-0 bg-foreground rounded-full flex items-center justify-center">
            <User size={16} strokeWidth={1.5} className="text-background" />
          </figure>
        ) : (
          <AiIconAnimation size={20} className="text-foreground-muted shrink-0" />
        )}

        <ReactMarkdown
          className="space-y-5 flex-1 [&>*>code]:text-xs [&>*>*>code]:text-xs min-w-0 [&_li]:space-y-4"
          remarkPlugins={[remarkGfm]}
          components={{
            pre: ({ children }: any) => {
              const code = children[0]
              const language = code.props.className?.replace('language-', '') || 'sql'
              return (
                <div className="w-auto -ml-[36px] overflow-x-hidden">
                  <CodeBlock
                    language={language}
                    value={code.props.children[0]}
                    className={cn(
                      'max-h-96 max-w-none block border rounded !bg-transparent !py-3 !px-3.5 prose dark:prose-dark text-foreground',
                      '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap [&>code]:block [&>code>span]:text-foreground'
                    )}
                  />
                </div>
              )
            },
            code: ({ children, className }: any) => {
              if (className) return null // handled by pre
              return (
                <code className="text-xs bg-background-surface-200 px-1 py-0.5 rounded">
                  {children}
                </code>
              )
            },
            p: ({ children }: any) => <p className="mb-4">{children}</p>,
            ul: ({ children }: any) => <ul className="flex flex-col gap-y-4">{children}</ul>,
            ol: ({ children }: any) => <ol className="flex flex-col gap-y-4">{children}</ol>,
            li: ({ children }: any) => <li className="[&>pre]:mt-2">{children}</li>,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      {isLoading && (
        <div className="flex gap-2 items-center text-foreground-lighter mt-2">
          <div className="animate-pulse">Thinking...</div>
        </div>
      )}
    </motion.div>
  )
}

interface SupabaseService {
  name: 'Auth' | 'Storage' | 'Database' | 'Edge Function' | 'Cron' | 'Queues' | 'Vector'
  reason: string
}

interface UserInfo {
  platform?: string
  userCount?: number
  industry?: string
  region?: string
  scale?: string
}

interface DatabaseConfig {
  region: string
  postgresVersion: string
  computeSize?: string
  storageSize?: number
  highAvailability?: boolean
}

function formatKey(key: string): string {
  return key
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .split(/(?=[A-Z])/)
    .join(' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase()) // Capitalize first letter
}

function InfoSection({ title, data }: { title: string; data: Record<string, any> }) {
  return (
    <div className="space-y-1 mt-4">
      <h3 className="font-medium text-sm mb-2">{title}</h3>
      {Object.entries(data).map(([key, value]) => {
        if (value === undefined || value === '') return null
        return (
          <div key={key} className="text-xs text-foreground-light font-mono">
            <span className="text-foreground-lighter">{formatKey(key)}: </span>
            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value.toString()}
          </div>
        )
      })}
    </div>
  )
}

export default function SchemaGenerator() {
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const db = useRef<PGlite | null>()
  const [services, setServices] = useState<SupabaseService[]>([])
  const [title, setTitle] = useState<string>('')
  const [userInfo, setUserInfo] = useState<UserInfo>()
  const [dbConfig, setDbConfig] = useState<DatabaseConfig>()

  useEffect(() => {
    db.current = new PGlite()
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

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/ai/generate',
    id: 'schema-generator',
    maxSteps: 7,
    initialMessages: [
      {
        id: '1',
        role: 'assistant',
        content:
          'Tell me about your application: What platform/framework, expected user scale, and key features do you need? This will help me design an optimized schema and suggest the right Supabase services.',
      },
    ],
    // Handle client-side tools
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === 'executeSql') {
        if (!db.current) return { success: false, error: 'Database not initialized' }
        try {
          console.log('Executing SQL:', toolCall.args.sql)
          await db.current.exec((toolCall.args as { sql: string }).sql)

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
            return { success: false, error: `Failed to get tables: ${error}` }
          }

          if (tables) {
            const graphData = await getGraphDataFromTables(tables)
            setNodes(graphData.nodes)
            setEdges(graphData.edges)
          }

          return { success: true, message: 'Database successfully updated' }
        } catch (error) {
          console.error('Failed to execute SQL:', error)
          return {
            success: false,
            error: `SQL execution failed: ${error instanceof Error ? error.message : String(error)}`,
          }
        }
      }

      if (toolCall.toolName === 'setServices') {
        const newServices = (toolCall.args as { services: SupabaseService[] }).services
        setServices(newServices)
        return 'Services updated successfully'
      }

      if (toolCall.toolName === 'setTitle') {
        const newTitle = (toolCall.args as { title: string }).title
        setTitle(newTitle)
        return 'Title updated successfully'
      }

      if (toolCall.toolName === 'saveUserInfo') {
        setUserInfo(toolCall.args as UserInfo)
        return 'User info saved successfully'
      }

      if (toolCall.toolName === 'setDatabaseConfig') {
        setDbConfig(toolCall.args as DatabaseConfig)
        return 'Database config saved successfully'
      }
    },
  })

  console.log('messages', messages)

  return (
    <div className="flex h-screen">
      <div className="flex-1 h-full bg-surface-100 relative">
        {nodes.length > 0 && (
          <div className="h-full">
            <ReactFlowProvider>
              <SchemaFlow nodes={nodes} edges={edges} />
            </ReactFlowProvider>
          </div>
        )}

        <div className="absolute bottom-4 left-4 p-4 bg-muted min-w-80 rounded-lg border shadow-lg">
          <div className="mb-2 font-medium">{title || 'Untitled Project'}</div>

          <div className="">
            <h3 className="text-sm font-medium mb-2">Services</h3>
            <TooltipProvider_Shadcn_>
              <div className="flex gap-2">
                {[
                  { name: 'Auth', icon: User2 },
                  { name: 'Storage', icon: File },
                  { name: 'Database', icon: Database },
                  { name: 'Edge Function', icon: Zap },
                  { name: 'Cron', icon: Clock },
                  { name: 'Queues', icon: ListOrdered },
                  { name: 'Vector', icon: Box },
                ].map((service) => {
                  const enabledService = services.find((s) => s.name === service.name)
                  const isEnabled = !!enabledService
                  return (
                    <Tooltip_Shadcn_ key={service.name} delayDuration={100}>
                      <TooltipTrigger_Shadcn_ asChild>
                        <div
                          className={`
                            flex items-center justify-center w-10 h-10 border rounded cursor-help
                            ${isEnabled ? 'border-brand-600 text-brand-600' : 'text-foreground-lighter'}
                          `}
                        >
                          <service.icon size={16} strokeWidth={2} />
                        </div>
                      </TooltipTrigger_Shadcn_>
                      <TooltipContent_Shadcn_>
                        {isEnabled ? `${service.name}: ${enabledService.reason}` : service.name}
                      </TooltipContent_Shadcn_>
                    </Tooltip_Shadcn_>
                  )
                })}
              </div>
            </TooltipProvider_Shadcn_>
          </div>

          {userInfo && <InfoSection title="Project Details" data={userInfo} />}
          {dbConfig && <InfoSection title="Database Configuration" data={dbConfig} />}
          {nodes.length > 0 && (
            <div className="mt-4">
              <Button size="small" type="primary" className="w-full mt-4">
                Create Project
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="w-[400px] border-l h-full flex flex-col">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <h1 className="font-medium">Create a project</h1>
              <Button size="small" type="default">
                Skip to dashboard
              </Button>
            </div>
          </div>

          <div className="space-y-4 mb-4">
            {messages
              .filter((m) => m.content?.length > 0)
              .map((m: Message) => (
                <div key={m.id}>
                  <Message
                    role={m.role as 'user' | 'assistant' | 'system'}
                    content={m.content}
                    isLoading={m === messages[messages.length - 1] && !m.content}
                  />
                </div>
              ))}
          </div>
        </div>

        <div className="p-5 border-t">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="Describe your application..."
              value={input}
              autoFocus
              onChange={handleInputChange}
              className="flex-1"
            />
          </form>
        </div>
      </div>
    </div>
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
