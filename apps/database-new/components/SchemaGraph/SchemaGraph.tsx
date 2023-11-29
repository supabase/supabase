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
import { useAppStateSnapshot } from '@/lib/state'
import { Loader2 } from 'lucide-react'

interface SchemaGraphProps {
  tables: PostgresTable[]
  threadIsLoading?: boolean
}

const TablesGraph = ({ tables, threadIsLoading }: SchemaGraphProps) => {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const reactFlowInstance = useReactFlow()
  const nodeTypes = useMemo(() => ({ table: TableNode }), [])
  const snap = useAppStateSnapshot()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    getGraphDataFromTables(tables).then(({ nodes, edges }) => {
      reactFlowInstance.setNodes(nodes)
      reactFlowInstance.setEdges(edges)
      setTimeout(() => reactFlowInstance.fitView({}), 10)
    })
  }, [tables, resolvedTheme, reactFlowInstance, snap])

  return (
    <>
      <div className={cn('grow', snap.layout === 'two-col' ? 'h-1/2 w-full ' : 'h-full w-1/2 ')}>
        {threadIsLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin opacity-30" />
          </div>
        ) : (
          <div className="border w-full h-full fade-in">
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
        )}
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
