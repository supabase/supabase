import { PGlite } from '@electric-sql/pglite'
import { PostgresMetaBase, wrapError, wrapResult } from '@gregnr/postgres-meta/base'
import { useEffect, useRef, useState } from 'react'
import { Edge, Node, ReactFlowProvider } from 'reactflow'

import { SchemaFlow } from 'components/interfaces/ProjectCreation/SchemaFlow'
import { getGraphDataFromTables } from '../Database/Schemas/Schemas.utils'
import { TableNodeData } from '../Database/Schemas/SchemaTableNode'

export const TABLE_NODE_WIDTH = 640
export const TABLE_NODE_ROW_HEIGHT = 80

interface SchemaVisualizerProps {
  sqlStatements: string[]
  className?: string
}

const AUTH_SCHEMA_SQL = `
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
`.trim()

export const SchemaVisualizer = ({ sqlStatements, className }: SchemaVisualizerProps) => {
  const [nodes, setNodes] = useState<Node<TableNodeData>[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const db = useRef<PGlite>()
  const executedStatements = useRef<Set<string>>(new Set())

  // Initialize database once
  useEffect(() => {
    db.current = new PGlite()

    // Execute initial auth schema setup
    db.current.exec(AUTH_SCHEMA_SQL)
  }, [])

  // Execute new SQL statements and update schema
  useEffect(() => {
    const updateSchema = async () => {
      if (!db.current) return

      // Reset if statements is empty
      if (sqlStatements.length === 0) {
        setNodes([])
        setEdges([])
        if (executedStatements.current.size) {
          executedStatements.current.clear()
          // Reset database
          db.current = new PGlite()
          // Re-run initial auth schema setup
          db.current.exec(AUTH_SCHEMA_SQL)
        }
        return
      }

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
              if (!res) throw new Error('No response from database')
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
          const { nodes, edges } = await getGraphDataFromTables(
            'onboarding',
            { id: 1, name: 'public', owner: 'admin' },
            tables
          )
          setNodes(nodes)
          setEdges(edges)
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
