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
  hideChat: boolean
}

const TablesGraph = ({ tables, hideChat }: SchemaGraphProps) => {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const reactFlowInstance = useReactFlow()
  const nodeTypes = useMemo(() => ({ table: TableNode }), [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (reactFlowInstance) {
      const chatWidth = window.innerWidth >= 1536 ? 500 : 400
      const zoom = reactFlowInstance.getZoom()
      const viewport = reactFlowInstance.getViewport()

      reactFlowInstance.setViewport({
        x: hideChat ? viewport.x + chatWidth : viewport.x - chatWidth,
        y: viewport.y,
        zoom,
      })
    }
  }, [hideChat])

  const backgroundPatternColor = resolvedTheme === 'dark' ? '#2e2e2e' : '#e6e8eb'
  const edgeStrokeColor = resolvedTheme === 'dark' ? '#ededed' : '#111318'

  useEffect(() => {
    getGraphDataFromTables(tables).then(({ nodes, edges }) => {
      reactFlowInstance.setNodes(nodes)
      reactFlowInstance.setEdges(edges)
      setTimeout(() => reactFlowInstance.fitView({}))
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
              stroke: edgeStrokeColor,
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
            <Background gap={16} color={backgroundPatternColor} variant={BackgroundVariant.Lines} />
          )}
        </ReactFlow>
      </div>
    </>
  )
}

const SchemaGraph = ({ tables, hideChat }: SchemaGraphProps) => {
  return (
    <ReactFlowProvider>
      <TablesGraph tables={tables} hideChat={hideChat} />
    </ReactFlowProvider>
  )
}

export default SchemaGraph
