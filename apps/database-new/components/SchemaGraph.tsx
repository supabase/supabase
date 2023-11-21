'use client'
import { PostgresTable } from '@/lib/types'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useRef } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { cn } from 'ui'

import TableNode from './SchemaGraph/TableNode'
import { getGraphDataFromTables } from './SchemaGraph/SchemaGraph.utils'

interface SchemaGraphProps {
  tables: PostgresTable[]
  hideChat: boolean
}

const TablesGraph = ({ tables, hideChat }: SchemaGraphProps) => {
  const instanceRef = useRef<any>()
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    if (instanceRef.current) {
      const chatWidth = window.innerWidth >= 1536 ? 500 : 400
      const instance = instanceRef.current
      const zoom = instance.getZoom()
      const viewport = instance.getViewport()

      instance.setViewport({
        x: hideChat ? viewport.x + chatWidth : viewport.x - chatWidth,
        y: viewport.y,
        zoom,
      })
    }
  }, [hideChat, instanceRef])

  const backgroundPatternColor = resolvedTheme === 'dark' ? '#2e2e2e' : '#e6e8eb'
  const edgeStrokeColor = resolvedTheme === 'dark' ? '#ededed' : '#111318'

  const reactFlowInstance = useReactFlow()
  const nodeTypes = useMemo(() => ({ table: TableNode }), [])

  useEffect(() => {
    getGraphDataFromTables(tables).then(({ nodes, edges }) => {
      reactFlowInstance.setNodes(nodes)
      reactFlowInstance.setEdges(edges)
      setTimeout(() => reactFlowInstance.fitView({})) // it needs to happen during next event tick
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
            instanceRef.current = instance
          }}
        >
          <Background gap={16} color={backgroundPatternColor} variant={BackgroundVariant.Lines} />
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
