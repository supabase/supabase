import type { PostgresSchema, PostgresTable } from '@supabase/postgres-meta'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import {
  Background,
  BackgroundVariant,
  ColorMode,
  Edge,
  MiniMap,
  Node,
  OnSelectionChangeParams,
  ReactFlow,
  useReactFlow,
} from '@xyflow/react'
import { Check, ChevronDown, Copy, Download, Loader2, Plus } from 'lucide-react'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'

import '@xyflow/react/dist/style.css'

import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import { SidePanelEditor } from '../../TableGridEditor/SidePanelEditor/SidePanelEditor'
import { DefaultEdge } from './DefaultEdge'
import { SchemaGraphContextProvider, SchemaGraphContextType } from './SchemaGraphContext'
import { SchemaGraphLegend } from './SchemaGraphLegend'
import { EdgeData, TableNodeData } from './Schemas.constants'
import {
  getGraphDataFromTables,
  getLayoutedElementsViaDagre,
  getSchemaAsMarkdown,
} from './Schemas.utils'
import { TableNode } from './SchemaTableNode'
import { useExportSchemaToImage } from './useExportSchemaToImage'
import AlertError from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import SchemaSelector from '@/components/ui/SchemaSelector'
import { useSchemasQuery } from '@/data/database/schemas-query'
import { useTablesQuery } from '@/data/tables/tables-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useLocalStorage } from '@/hooks/misc/useLocalStorage'
import { useQuerySchemaState } from '@/hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useIsProtectedSchema } from '@/hooks/useProtectedSchemas'
import { useStaticEffectEvent } from '@/hooks/useStaticEffectEvent'
import { tablesToSQL } from '@/lib/helpers'
import { useTableEditorStateSnapshot } from '@/state/table-editor'

// [Joshen] Persisting logic: Only save positions to local storage WHEN a node is moved OR when explicitly clicked to reset layout

export const SchemaGraph = () => {
  const { ref } = useParams()
  const { resolvedTheme } = useTheme()
  const { data: project } = useSelectedProjectQuery()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()
  const [selectedTable, setSelectedTable] = useState<PostgresTable | null>(null)
  const snap = useTableEditorStateSnapshot()
  const { isDownloading, exportSchemaToImage } = useExportSchemaToImage()

  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (copied) {
      setTimeout(() => setCopied(false), 2000)
    }
  }, [copied])

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
  const edgeTypes = useMemo(
    () => ({
      default: DefaultEdge,
    }),
    []
  )

  const {
    data: schemas,
    error: errorSchemas,
    isSuccess: isSuccessSchemas,
    isPending: isLoadingSchemas,
    isError: isErrorSchemas,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const {
    data: tables = [],
    error: errorTables,
    isSuccess: isSuccessTables,
    isPending: isLoadingTables,
    isError: isErrorTables,
  } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: selectedSchema,
    includeColumns: true,
  })
  const hasNoTables = isSuccessSchemas && tables.length === 0

  const schema = (schemas ?? []).find((s) => s.name === selectedSchema)
  const [, setStoredPositions] = useLocalStorage(
    LOCAL_STORAGE_KEYS.SCHEMA_VISUALIZER_POSITIONS(ref as string, schema?.id ?? 0),
    {}
  )

  const { can: canUpdateTables } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'tables'
  )

  const { isSchemaLocked } = useIsProtectedSchema({ schema: selectedSchema })

  const canAddTables = canUpdateTables && !isSchemaLocked

  const resetLayout = async () => {
    const nodes = reactFlowInstance.getNodes()
    const edges = reactFlowInstance.getEdges()

    getLayoutedElementsViaDagre(
      nodes.filter((item) => item.type === 'table') as Node<TableNodeData>[],
      edges
    )
    reactFlowInstance.setNodes(nodes)
    reactFlowInstance.setEdges(edges)
    await new Promise<void>((resolve) =>
      setTimeout(async () => {
        await reactFlowInstance.fitView({})
        resolve()
      })
    )
    saveNodePositions()
  }

  const saveNodePositions = useStaticEffectEvent(() => {
    if (schema === undefined) return console.error('Schema is required')

    const nodes = reactFlowInstance.getNodes()
    if (nodes.length > 0) {
      const nodesPositionData = nodes.reduce((a, b) => {
        return { ...a, [b.id]: b.position }
      }, {})
      setStoredPositions(nodesPositionData)
    }
  })

  const [selectedEdge, setSelectedEdge] = useState<Edge | undefined>(undefined)
  const handleSelectionChange = useStaticEffectEvent(
    (params: OnSelectionChangeParams<Node<TableNodeData>, Edge<EdgeData>>) => {
      if (params.edges.length === 1) {
        setSelectedEdge(params.edges[0])
      } else {
        setSelectedEdge(undefined)
      }

      const selectedNodeIds = new Set(params.nodes.map((n) => n.id))
      reactFlowInstance.setEdges(
        reactFlowInstance.getEdges().map((edge) => ({
          ...edge,
          animated:
            selectedNodeIds.size > 0 &&
            (selectedNodeIds.has(edge.source) || selectedNodeIds.has(edge.target)),
        }))
      )
    }
  )

  const downloadImage = async (format: 'png' | 'svg') => {
    const reactflowViewport = document.querySelector('.react-flow__viewport') as HTMLElement
    if (!reactflowViewport) return
    if (!ref) return
    const { x, y, zoom } = reactFlowInstance.getViewport()
    exportSchemaToImage({ element: reactflowViewport, format, x, y, zoom, projectRef: ref })
  }

  const isFirstLoad = useRef(true)
  useEffect(() => {
    if (isSuccessTables && isSuccessSchemas && tables.length > 0) {
      const schema = schemas.find((s) => s.name === selectedSchema) as PostgresSchema
      getGraphDataFromTables(ref as string, schema, tables).then(({ nodes, edges }) => {
        reactFlowInstance.setNodes(nodes)
        reactFlowInstance.setEdges(edges)
        // Prevent resetting a view after first load to avoid layout changes after editing a column
        if (isFirstLoad.current) {
          isFirstLoad.current = false
          setTimeout(() => reactFlowInstance.fitView({})) // it needs to happen during next event tick
        }
      })
    }
  }, [
    isSuccessTables,
    isSuccessSchemas,
    tables,
    reactFlowInstance,
    ref,
    resolvedTheme,
    schemas,
    selectedSchema,
  ])

  const schemaGraphContext = useMemo<SchemaGraphContextType>(
    () => ({
      selectedEdge,
      isDownloading,
      onEditColumn: (tableId, columnId) => {
        const table = tables.find((table) => table.id === tableId)
        if (!table || table.columns == null) return

        const column = table.columns.find((column) => column.id === columnId)
        if (!column) return

        setSelectedTable(table)
        snap.onEditColumn(column)
      },
      onEditTable: (tableId) => {
        const table = tables.find((table) => table.id === tableId)
        if (!table || table.columns == null) return

        setSelectedTable(table)
        snap.onEditTable()
      },
    }),
    [tables, snap, isDownloading, selectedEdge]
  )

  return (
    <>
      <div className="flex items-center justify-between p-4 border-b border-muted h-(--header-height)">
        {isLoadingSchemas && (
          <div className="h-[34px] w-[260px] bg-foreground-lighter rounded-sm shimmering-loader" />
        )}

        {isErrorSchemas && <AlertError error={errorSchemas} subject="Failed to retrieve schemas" />}

        {isSuccessSchemas && (
          <>
            <SchemaSelector
              className="w-[180px]"
              size="tiny"
              showError={false}
              selectedSchemaName={selectedSchema}
              onSelectSchema={setSelectedSchema}
            />
            {!hasNoTables && (
              <div className="flex items-center gap-x-2">
                <div className="flex items-center gap-0">
                  <ButtonTooltip
                    type="default"
                    className="rounded-r-none border-r-0"
                    icon={copied ? <Check data-testid="copy-sql-ready" /> : <Copy />}
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
                              This schema is for context or debugging only. Table order and
                              constraints may be invalid. Not meant to be run as-is.
                            </p>
                          </div>
                        ),
                      },
                    }}
                  >
                    Copy as SQL
                  </ButtonTooltip>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="default"
                        size="tiny"
                        className="rounded-l-none pl-1 pr-0"
                        icon={<ChevronDown size={12} />}
                      >
                        <span className="sr-only">Export options</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem
                        className="flex items-center space-x-2 whitespace-nowrap"
                        onClick={(e) => {
                          e.stopPropagation()
                          const tables = reactFlowInstance
                            .getNodes()
                            .filter((node) => node.type === 'table')
                            .map((node) => node.data as TableNodeData)

                          copyToClipboard(getSchemaAsMarkdown(selectedSchema, tables))
                          setCopied(true)
                        }}
                      >
                        <Copy size={12} />
                        <span>Copy as Markdown</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center space-x-2 whitespace-nowrap"
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadImage('png')
                        }}
                      >
                        <Download size={12} />
                        <span>Download as PNG</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="flex items-center space-x-2 whitespace-nowrap"
                        onClick={(e) => {
                          e.stopPropagation()
                          downloadImage('svg')
                        }}
                      >
                        <Download size={12} />
                        <span>Download as SVG</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <ButtonTooltip
                      type="default"
                      tooltip={{
                        content: {
                          side: 'bottom',
                          text: 'Automatically arrange the layout of all nodes',
                        },
                      }}
                    >
                      Auto layout
                    </ButtonTooltip>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm to rearrange all nodes</AlertDialogTitle>
                      <AlertDialogDescription>
                        Auto layout will rearrange all nodes in the graph. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={resetLayout}>Apply</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
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
          {hasNoTables ? (
            <div className="flex items-center justify-center w-full h-full">
              <Admonition
                type="default"
                className="max-w-md"
                title="No tables in schema"
                description={
                  isSchemaLocked
                    ? `The “${selectedSchema}” schema is managed by Supabase and is read-only through
                    the dashboard.`
                    : !canUpdateTables
                      ? 'You need additional permissions to create tables'
                      : `The “${selectedSchema}” schema doesn’t have any tables.`
                }
              >
                {canAddTables && (
                  <Button asChild className="mt-2" type="default" icon={<Plus />}>
                    <Link href={`/project/${ref}/editor?create=table`}>New table</Link>
                  </Button>
                )}
              </Admonition>
            </div>
          ) : (
            <SchemaGraphContextProvider value={schemaGraphContext}>
              <div className="w-full h-full">
                <ReactFlow<Node<TableNodeData>, Edge<EdgeData>>
                  // FIXME: https://github.com/xyflow/xyflow/issues/4876
                  colorMode={'' as unknown as ColorMode}
                  defaultNodes={[]}
                  defaultEdges={[]}
                  defaultEdgeOptions={{
                    type: 'default',
                    animated: false,
                    deletable: false,
                  }}
                  nodeTypes={nodeTypes}
                  edgeTypes={edgeTypes}
                  fitView
                  minZoom={0.8}
                  maxZoom={1.8}
                  proOptions={{ hideAttribution: true }}
                  onNodeDragStop={saveNodePositions}
                  onSelectionChange={handleSelectionChange}
                >
                  <Background
                    gap={16}
                    className="*:stroke-foreground-muted opacity-25"
                    variant={BackgroundVariant.Dots}
                    color={'inherit'}
                  />
                  <MiniMap
                    pannable
                    zoomable
                    nodeColor={miniMapNodeColor}
                    maskColor={miniMapMaskColor}
                    className="border rounded-md shadow-xs"
                  />
                  <SchemaGraphLegend />
                </ReactFlow>
              </div>
            </SchemaGraphContextProvider>
          )}
        </>
      )}
      <SidePanelEditor selectedTable={selectedTable ?? undefined} includeColumns />
    </>
  )
}
