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
  const snap = useAppStateSnapshot()
  const params = useParams()

  const runId = params.runId as string

  useEffect(() => {
    const runIsLoading = snap.runsLoading.includes(runId)
    if (runIsLoading) {
      // let currentRunsLoading = snap.runsLoading
      const payload = [...snap.runsLoading.filter((item) => item !== runId)]
      snap.setRunsLoading([...payload])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]) // Intentionally left snap out of the dependency array

  return (
    <ReactFlowProvider>
      <SchemaFlowHandler content={content} />
    </ReactFlowProvider>
  )
}

export default ExportedSchemaGraph
