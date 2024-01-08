'use client'

import { PostgresTable } from '@/lib/types'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { cn } from 'ui'

import { getGraphDataFromTables } from './SchemaFlow.utils'
import TableNode from './TableNode'
import { useAppStateSnapshot } from '@/lib/state'
import { useParams } from 'next/navigation'
import { set } from 'lodash'
import { parseTables } from '@/lib/utils'

interface SchemaGraphProps {
  tables?: PostgresTable[]
  content: any
}

const SchemaFlowHandler = ({ content }: SchemaGraphProps) => {
  console.log('the actual content', content)
  const fakeContent = `CREATE TABLE
  users (
    id bigint primary key generated always as identity,
    username text,
    email text,
    password text,
    joined_at timestamp with time zone
  );

CREATE TABLE
  tweets (
    id bigint primary key generated always as identity,
    user_id bigint,
    content text,
    created_at timestamp with time zone,
    foreign key (user_id) references users (id)
  );
`
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [tables, setTables] = useState<PostgresTable[]>([])
  const reactFlowInstance = useReactFlow()
  const nodeTypes = useMemo(() => ({ table: TableNode }), [])

  useEffect(() => {
    setMounted(true)

    const parseTableData = async () => {
      try {
        const tables = await parseTables(content)
        setTables(tables)
      } catch (error) {
        // Handle errors
        console.log('error', error)
      }
    }

    parseTableData() // Call the async function
  }, [])

  useEffect(() => {
    getGraphDataFromTables(tables).then(({ nodes, edges }) => {
      reactFlowInstance.setNodes(nodes)
      reactFlowInstance.setEdges(edges)
      setTimeout(() => reactFlowInstance.fitView({}), 10)
    })
  }, [tables, resolvedTheme, reactFlowInstance])

  return (
    <>
      <div className="h-full grow fade-in">
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
          minZoom={0.8}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          onInit={(instance) => {
            instance.fitView()
          }}
        >
          {mounted && (
            <Background
              gap={16}
              className="[&>*]:stroke-foreground-muted opacity-[25%]"
              variant={BackgroundVariant.Dots}
              color={'inherit'}
            />
          )}
        </ReactFlow>
      </div>
    </>
  )
}

const ExportedSchemaGraph = ({ content }: SchemaGraphProps) => {
  return (
    <ReactFlowProvider>
      <SchemaFlowHandler content={content} />
    </ReactFlowProvider>
  )
}

export default ExportedSchemaGraph
