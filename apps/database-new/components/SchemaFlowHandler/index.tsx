'use client'

import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { PostgresTable } from '@/lib/types'
import { parseTables } from '@/lib/utils'
import { getGraphDataFromTables } from './SchemaFlow.utils'
import { TableNode } from 'ui-patterns'

interface SchemaGraphProps {
  tables?: PostgresTable[]
  content: string
}

const SchemaFlowHandler = ({ content }: SchemaGraphProps) => {
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
        console.log('error', error)
      }
    }

    parseTableData()
  }, [])

  useEffect(() => {
    getGraphDataFromTables(tables).then(({ nodes, edges }) => {
      reactFlowInstance.setNodes(nodes)
      reactFlowInstance.setEdges(edges)
      setTimeout(() => reactFlowInstance.fitView({ minZoom: 1 }), 50)
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
