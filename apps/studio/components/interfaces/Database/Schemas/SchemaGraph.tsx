import type { PostgresSchema } from '@supabase/postgres-meta'
import { toPng } from 'html-to-image'
import { Download, Loader2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'
import ReactFlow, { Background, BackgroundVariant, MiniMap, useReactFlow } from 'reactflow'
import 'reactflow/dist/style.css'

import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import SchemaSelector from 'components/ui/SchemaSelector'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { SchemaGraphLegend } from './SchemaGraphLegend'
import { getGraphDataFromTables, getLayoutedElementsViaDagre } from './Schemas.utils'
import { TableNode } from './SchemaTableNode'

// [Joshen] Persisting logic: Only save positions to local storage WHEN a node is moved OR when explicitly clicked to reset layout

export const SchemaGraph = () => {
  const { ref } = useParams()
  const { resolvedTheme } = useTheme()
  const { project } = useProjectContext()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()

  const [isDownloading, setIsDownloading] = useState(false)

  const miniMapNodeColor = '#111318'
  const miniMapMaskColor = resolvedTheme?.includes('dark')
    ? 'rgb(17, 19, 24, .8)'
    : 'rgb(237, 237, 237, .8)'

  const reactFlowInstance = useReactFlow()
  const nodeTypes = useMemo(
    () => ({
      table: TableNode,
    }),
    []
  )

  const {
    data: schemas,
    error: errorSchemas,
    isSuccess: isSuccessSchemas,
    isLoading: isLoadingSchemas,
    isError: isErrorSchemas,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const {
    data: tables,
    error: errorTables,
    isSuccess: isSuccessTables,
    isLoading: isLoadingTables,
    isError: isErrorTables,
  } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: selectedSchema,
    includeColumns: true,
  })

  const schema = (schemas ?? []).find((s) => s.name === selectedSchema)
  const [_, setStoredPositions] = useLocalStorage(
    LOCAL_STORAGE_KEYS.SCHEMA_VISUALIZER_POSITIONS(ref as string, schema?.id ?? 0),
    {}
  )

  const resetLayout = () => {
    const nodes = reactFlowInstance.getNodes()
    const edges = reactFlowInstance.getEdges()

    getLayoutedElementsViaDagre(nodes, edges)
    reactFlowInstance.setNodes(nodes)
    reactFlowInstance.setEdges(edges)
    setTimeout(() => reactFlowInstance.fitView({}))
    saveNodePositions()
  }

  const saveNodePositions = () => {
    if (schema === undefined) return console.error('Schema is required')

    const nodes = reactFlowInstance.getNodes()
    if (nodes.length > 0) {
      const nodesPositionData = nodes.reduce((a, b) => {
        return { ...a, [b.id]: b.position }
      }, {})
      setStoredPositions(nodesPositionData)
    }
  }

  const downloadImage = () => {
    const reactflowViewport = document.querySelector('.react-flow__viewport') as HTMLElement
    if (!reactflowViewport) return

    setIsDownloading(true)
    const width = reactflowViewport.clientWidth
    const height = reactflowViewport.clientHeight
    const { x, y, zoom } = reactFlowInstance.getViewport()

    toPng(reactflowViewport, {
      backgroundColor: 'white',
      width,
      height,
      style: {
        width: width.toString(),
        height: height.toString(),
        transform: `translate(${x}px, ${y}px) scale(${zoom})`,
      },
    })
      .then((data) => {
        const a = document.createElement('a')
        a.setAttribute('download', `supabase-schema-${ref}.png`)
        a.setAttribute('href', data)
        a.click()
      })
      .finally(() => {
        setIsDownloading(false)
      })
  }

  useEffect(() => {
    if (isSuccessTables && isSuccessSchemas && tables.length > 0) {
      const schema = schemas.find((s) => s.name === selectedSchema) as PostgresSchema
      getGraphDataFromTables(ref as string, schema, tables).then(({ nodes, edges }) => {
        reactFlowInstance.setNodes(nodes)
        reactFlowInstance.setEdges(edges)
        setTimeout(() => reactFlowInstance.fitView({})) // it needs to happen during next event tick
      })
    }
  }, [isSuccessTables, isSuccessSchemas, tables, resolvedTheme])

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-muted">
        {isLoadingSchemas && (
          <div className="h-[34px] w-[260px] bg-foreground-lighter rounded shimmering-loader" />
        )}

        {isErrorSchemas && (
          <AlertError error={errorSchemas as any} subject="Failed to retrieve schemas" />
        )}

        {isSuccessSchemas && (
          <>
            <SchemaSelector
              className="w-[180px]"
              size="tiny"
              showError={false}
              selectedSchemaName={selectedSchema}
              onSelectSchema={setSelectedSchema}
            />
            <div className="flex items-center gap-x-2">
              <ButtonTooltip
                type="default"
                loading={isDownloading}
                className="px-1.5"
                icon={<Download />}
                onClick={downloadImage}
                tooltip={{ content: { side: 'bottom', text: 'Download current view as PNG' } }}
              />
              <ButtonTooltip
                type="default"
                onClick={resetLayout}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: 'Automatically arrange the layout of all nodes',
                  },
                }}
              >
                Auto layout
              </ButtonTooltip>
            </div>
          </>
        )}
      </div>
      {isLoadingTables && (
        <div className="w-full h-full flex items-center justify-center gap-x-2">
          <Loader2 className="animate-spin text-foreground-light" size={16} />
          <p className="text-sm text-foreground-light">Loading tables</p>
        </div>
      )}
      {isErrorTables && (
        <div className="w-full h-full flex items-center justify-center px-20">
          <AlertError subject="Failed to retrieve tables" error={errorTables} />
        </div>
      )}
      {isSuccessTables && (
        <>
          {tables.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <ProductEmptyState
                title="No tables created yet"
                ctaButtonLabel="Create a new table"
                ctaUrl={`/project/${ref}/editor?create=table`}
              >
                <p className="text-sm text-foreground-light">
                  There are no tables found in the schema "{selectedSchema}"
                </p>
              </ProductEmptyState>
            </div>
          ) : (
            <div className="w-full h-full">
              <ReactFlow
                defaultNodes={[]}
                defaultEdges={[]}
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: true,
                  deletable: false,
                  style: {
                    stroke: 'hsl(var(--border-stronger))',
                    strokeWidth: 1,
                  },
                }}
                nodeTypes={nodeTypes}
                fitView
                minZoom={0.8}
                maxZoom={1.8}
                proOptions={{ hideAttribution: true }}
                onNodeDragStop={() => saveNodePositions()}
              >
                <Background
                  gap={16}
                  className="[&>*]:stroke-foreground-muted opacity-[25%]"
                  variant={BackgroundVariant.Dots}
                  color={'inherit'}
                />
                <MiniMap
                  pannable
                  zoomable
                  nodeColor={miniMapNodeColor}
                  maskColor={miniMapMaskColor}
                  className="border rounded-md shadow-sm"
                />
                <SchemaGraphLegend />
              </ReactFlow>
            </div>
          )}
        </>
      )}
    </>
  )
}
