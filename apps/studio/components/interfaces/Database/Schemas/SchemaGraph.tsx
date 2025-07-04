import type { PostgresSchema } from '@supabase/postgres-meta'
import { toPng, toSvg } from 'html-to-image'
import { Check, Download, Loader2, Clipboard, Info } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'
import ReactFlow, { Background, BackgroundVariant, MiniMap, useReactFlow } from 'reactflow'
import 'reactflow/dist/style.css'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import ProductEmptyState from 'components/to-be-cleaned/ProductEmptyState'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import SchemaSelector from 'components/ui/SchemaSelector'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useTablesQuery } from 'data/tables/tables-query'
import { useLocalStorage } from 'hooks/misc/useLocalStorage'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { toast } from 'sonner'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'
import { SchemaGraphLegend } from './SchemaGraphLegend'
import { getGraphDataFromTables, getLayoutedElementsViaDagre } from './Schemas.utils'
import { TableNode } from './SchemaTableNode'
import { copyToClipboard } from 'ui'
// [Joshen] Persisting logic: Only save positions to local storage WHEN a node is moved OR when explicitly clicked to reset layout

export const SchemaGraph = () => {
  const { ref } = useParams()
  const { resolvedTheme } = useTheme()
  const { project } = useProjectContext()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()

  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (copied) {
      setTimeout(() => setCopied(false), 2000)
    }
  }, [copied])

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

  const downloadImage = (format: 'png' | 'svg') => {
    const reactflowViewport = document.querySelector('.react-flow__viewport') as HTMLElement
    if (!reactflowViewport) return

    setIsDownloading(true)
    const width = reactflowViewport.clientWidth
    const height = reactflowViewport.clientHeight
    const { x, y, zoom } = reactFlowInstance.getViewport()

    if (format === 'svg') {
      toSvg(reactflowViewport, {
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
          a.setAttribute('download', `supabase-schema-${ref}.svg`)
          a.setAttribute('href', data)
          a.click()
          toast.success('Successfully downloaded as SVG')
        })
        .catch((error) => {
          console.error('Failed to download:', error)
          toast.error('Failed to download current view:', error.message)
        })
        .finally(() => {
          setIsDownloading(false)
        })
    } else if (format === 'png') {
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
          toast.success('Successfully downloaded as PNG')
        })
        .catch((error) => {
          console.error('Failed to download:', error)
          toast.error('Failed to download current view:', error.message)
        })
        .finally(() => {
          setIsDownloading(false)
        })
    }
  }

  function tablesToSQL(t: typeof tables) {
    if (!Array.isArray(t)) return ''
    const warning =
      '-- WARNING: This schema is for context only and is not meant to be run.\n-- Table order and constraints may not be valid for execution.\n\n'
    const sql = t
      .map((table) => {
        if (!table || !Array.isArray((table as any).columns)) return ''

        const columns = (table as { columns?: any[] }).columns ?? []
        const columnLines = columns.map((c) => {
          let line = `  ${c.name} ${c.data_type}`
          if (c.is_identity) {
            line += ' GENERATED ALWAYS AS IDENTITY'
          }
          if (c.is_nullable === false) {
            line += ' NOT NULL'
          }
          if (c.default_value !== null && c.default_value !== undefined) {
            line += ` DEFAULT ${c.default_value}`
          }
          if (c.is_unique) {
            line += ' UNIQUE'
          }
          if (c.check) {
            line += ` CHECK (${c.check})`
          }
          return line
        })

        const constraints: string[] = []

        if (Array.isArray(table.primary_keys) && table.primary_keys.length > 0) {
          const pkCols = table.primary_keys.map((pk) => pk.name).join(', ')
          constraints.push(`  CONSTRAINT ${table.name}_pkey PRIMARY KEY (${pkCols})`)
        }

        if (Array.isArray(table.relationships)) {
          table.relationships.forEach((rel) => {
            if (rel && rel.source_table_name === table.name) {
              constraints.push(
                `  CONSTRAINT ${rel.constraint_name} FOREIGN KEY (${rel.source_column_name}) REFERENCES ${rel.target_table_schema}.${rel.target_table_name}(${rel.target_column_name})`
              )
            }
          })
        }

        const allLines = [...columnLines, ...constraints]
        return `CREATE TABLE ${table.schema}.${table.name} (\n${allLines.join(',\n')}\n);`
      })
      .join('\n')
    return warning + sql
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
                type="outline"
                icon={copied ? <Check /> : <Clipboard />}
                onClick={() => {
                  if (tables) {
                    copyToClipboard(tablesToSQL(tables))
                    setCopied(true)
                  }
                }}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: (
                      <div className="max-w-[180px] space-y-2 text-foreground-light">
                        <p className="text-foreground">Note</p>
                        <p>
                          This schema is for context or debugging only. Table order and constraints
                          may be invalid. Not meant to be run as-is.
                        </p>
                      </div>
                    ),
                  },
                }}
              >
                Copy as SQL
              </ButtonTooltip>
              <ButtonTooltip
                type="default"
                loading={isDownloading}
                className="px-1.5"
                icon={<Download />}
                onClick={() => downloadImage('png')}
                tooltip={{ content: { side: 'bottom', text: 'Download current view as PNG' } }}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <ButtonTooltip
                    type="default"
                    loading={isDownloading}
                    className="px-1.5"
                    icon={<Download />}
                    tooltip={{ content: { side: 'bottom', text: 'Download current view' } }}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-32">
                  <DropdownMenuItem onClick={() => downloadImage('png')}>
                    Download as PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadImage('svg')}>
                    Download as SVG
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
