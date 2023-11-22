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

import { getGraphDataFromTables } from './SchemaGraph.utils'
import TableNode from './TableNode'

interface SchemaGraphProps {
  tables: PostgresTable[]
}

const TablesGraph = ({ tables }: SchemaGraphProps) => {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const reactFlowInstance = useReactFlow()
  const nodeTypes = useMemo(() => ({ table: TableNode }), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    getGraphDataFromTables(tables).then(({ nodes, edges }) => {
      reactFlowInstance.setNodes(nodes)
      reactFlowInstance.setEdges(edges)
      setTimeout(() => reactFlowInstance.fitView({}), 10)
    })
  }, [tables, resolvedTheme])

  return (
    <>
      <div className={cn('h-full grow')}>
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
          minZoom={1}
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

const SchemaGraph = ({ tables }: SchemaGraphProps) => {
  return (
    <ReactFlowProvider>
      <TablesGraph tables={tables} />
    </ReactFlowProvider>
  )
}

export default SchemaGraph
