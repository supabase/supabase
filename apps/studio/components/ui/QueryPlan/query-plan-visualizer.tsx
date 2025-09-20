import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import ReactFlow, {
  Background,
  BackgroundVariant,
  type Node,
  type ReactFlowInstance,
} from 'reactflow'
import { BookOpen, Maximize2, Minimize2 } from 'lucide-react'
import 'reactflow/dist/style.css'

import type { PlanNodeData } from './types'
import { Button, cn } from 'ui'
import { MetaOverlay } from './meta-overlay'
import { ControlsOverlay } from './controls-overlay'
import { DEFAULT_NODE_HEIGHT, DEFAULT_NODE_WIDTH, NODE_TYPE } from './constants'
import {
  MetricsVisibilityContext,
  HeatmapContext,
  defaultMetricsVisibility,
  defaultHeatmapMeta,
  type MetricsVisibility,
  type HeatmapMode,
} from './contexts'
import { PlanNode } from './plan-node'
import { useHeatmapMax } from './hooks/use-heatmap-max'
import { usePlanGraph } from './hooks/use-plan-graph'
import { useDagreLayout } from './hooks/use-dagre-layout'
import { MetricsSidebar } from './metrics-sidebar'

export const QueryPlanVisualizer = ({ json, className }: { json: string; className?: string }) => {
  const { nodes, edges, meta } = usePlanGraph(json)

  const [metricsVisibility, setMetricsVisibility] =
    useState<MetricsVisibility>(defaultMetricsVisibility)

  // Heatmap mode and maxima across nodes
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>(defaultHeatmapMeta.mode)
  const heatMax = useHeatmapMax(nodes)

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const layout = useDagreLayout(nodes, edges, metricsVisibility, heatmapMode)

  useEffect(() => {
    requestAnimationFrame(() => rfInstance?.fitView())
  }, [isExpanded, rfInstance])

  const centerNodeInView = useCallback(
    (nodeId: string) => {
      if (!rfInstance) return

      const node = rfInstance.getNode(nodeId)
      if (!node) return

      const position = node.positionAbsolute ?? node.position
      const nodeWidth = node.width ?? DEFAULT_NODE_WIDTH
      const nodeHeight = node.height ?? DEFAULT_NODE_HEIGHT
      const centerX = position.x + nodeWidth / 2
      const centerY = position.y + nodeHeight / 2

      const currentZoom = rfInstance.getZoom()
      const targetZoom = currentZoom < 1 ? 1 : currentZoom

      rfInstance.setCenter(centerX, centerY, {
        zoom: targetZoom,
        duration: 400,
      })
    },
    [rfInstance]
  )

  const handleSelectNode = useCallback(
    (node: Node<PlanNodeData>) => {
      setSelectedNodeId(node.id)

      requestAnimationFrame(() => centerNodeInView(node.id))
    },
    [centerNodeInView]
  )

  useEffect(() => {
    if (!selectedNodeId) return

    const match = layout.nodes.find((node) => node.id === selectedNodeId)
    if (!match) {
      setSelectedNodeId(null)
    }
  }, [layout.nodes, selectedNodeId])

  const nodesWithSelection = useMemo(
    () =>
      layout.nodes.map((node) => ({
        ...node,
        selected: node.id === selectedNodeId,
      })),
    [layout.nodes, selectedNodeId]
  )

  useEffect(() => {
    if (!isExpanded || typeof document === 'undefined') return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isExpanded])

  useEffect(() => {
    if (!isExpanded) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      // prevent Query Details sheet from closing
      event.stopPropagation()
      event.preventDefault()

      setIsExpanded(false)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isExpanded])

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const nodeTypes = useMemo(
    () => ({
      [NODE_TYPE]: PlanNode,
    }),
    []
  )

  const renderVisualizer = (isExpanded: boolean) => (
    <>
      <div
        className={cn(
          'relative w-full h-full bg-background',
          isExpanded ? 'border-none' : 'border rounded-md'
        )}
      >
        <div className="flex h-full">
          {isExpanded && (
            <MetricsSidebar
              nodes={layout.nodes}
              edges={layout.edges}
              meta={meta}
              selectedNodeId={selectedNodeId}
              onSelect={handleSelectNode}
            />
          )}
          <div className="relative flex-1">
            {meta?.errorMessage && (
              <div className="absolute inset-0 z-20 flex items-start justify-center mt-10 pointer-events-none">
                <div className="pointer-events-auto border border-red-500/70 bg-foreground-muted/20 backdrop-blur-sm rounded px-3 py-2 max-w-[720px] text-[11px]">
                  <div className="font-semibold text-red-600">{meta.errorMessage}</div>
                  {meta.errorDetail && (
                    <div className="mt-1 whitespace-pre-wrap text-foreground-lighter">
                      {meta.errorDetail}
                    </div>
                  )}
                </div>
              </div>
            )}
            {isExpanded ? (
              <div className="flex h-[41px] w-full items-center gap-x-3 border-b border-border px-3 bg-sidebar">
                <ControlsOverlay
                  metricsVisibility={metricsVisibility}
                  setMetricsVisibility={setMetricsVisibility}
                  heatmapMode={heatmapMode}
                  setHeatmapMode={setHeatmapMode}
                  variant="toolbar"
                  portal={false}
                  className="shrink-0"
                />
                <div className="hidden md:block h-[20px] w-px border-r border-control" />
                <MetaOverlay
                  planningTime={meta?.planningTime}
                  executionTime={meta?.executionTime}
                  jitTotalTime={meta?.jitTotalTime}
                  className="hidden h-full flex-1 items-center border-0 bg-transparent px-0 py-0 text-xs md:flex"
                />
                <Button
                  asChild
                  type="default"
                  size="tiny"
                  icon={<BookOpen />}
                  className="ml-auto h-[28px]"
                >
                  <Link
                    href="https://supabase.com/docs/guides/troubleshooting/understanding-postgresql-explain-output-Un9dqX"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Learn about query plans
                  </Link>
                </Button>

                <Button
                  type="default"
                  size="tiny"
                  icon={<Minimize2 size={14} className="text-foreground" />}
                  onClick={toggleExpanded}
                  aria-label="Exit expanded view"
                  className="h-7 w-7"
                />
              </div>
            ) : (
              <div className="absolute top-2.5 left-2.5 right-2.5 z-20 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md border border-border bg-sidebar px-2.5 py-1.5 shadow-sm">
                <ControlsOverlay
                  metricsVisibility={metricsVisibility}
                  setMetricsVisibility={setMetricsVisibility}
                  heatmapMode={heatmapMode}
                  setHeatmapMode={setHeatmapMode}
                  variant="toolbar"
                  className="shrink-0"
                />
                <div className="h-5 w-px border-l border-border" />
                <MetaOverlay
                  planningTime={meta?.planningTime}
                  executionTime={meta?.executionTime}
                  jitTotalTime={meta?.jitTotalTime}
                  className="min-h-0 flex-1 border-0 bg-transparent px-0 py-0 text-xs"
                />
                <div className="h-5 w-px border-l border-border" />
                <Button
                  type="default"
                  size="tiny"
                  icon={<Maximize2 size={14} className="text-foreground" />}
                  onClick={toggleExpanded}
                  aria-label="Enter expanded view"
                  className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                />
              </div>
            )}

            {isExpanded && (
              <div className="absolute top-[46px] left-3 z-20 md:hidden">
                <MetaOverlay
                  planningTime={meta?.planningTime}
                  executionTime={meta?.executionTime}
                  jitTotalTime={meta?.jitTotalTime}
                  className="rounded-md bg-transparent border-none border-border px-2 py-1 text-[11px] shadow-sm"
                />
              </div>
            )}

            <MetricsVisibilityContext.Provider value={metricsVisibility}>
              <HeatmapContext.Provider
                value={{
                  mode: heatmapMode,
                  maxTime: heatMax.maxTime,
                  maxRows: heatMax.maxRows,
                  maxCost: heatMax.maxCost,
                }}
              >
                <ReactFlow
                  className="rounded-md"
                  defaultNodes={[]}
                  defaultEdges={[]}
                  nodesConnectable={false}
                  defaultEdgeOptions={{
                    type: 'smoothstep',
                    animated: true,
                    deletable: false,
                    style: {
                      stroke: 'hsl(var(--border-stronger))',
                      strokeWidth: 1,
                    },
                  }}
                  fitView
                  nodeTypes={nodeTypes}
                  nodes={nodesWithSelection}
                  edges={layout.edges}
                  minZoom={0.8}
                  maxZoom={1.8}
                  proOptions={{ hideAttribution: true }}
                  onNodeClick={(_event, node) => handleSelectNode(node)}
                  onPaneClick={() => {
                    setSelectedNodeId(null)
                  }}
                  onInit={(instance) => setRfInstance(instance)}
                >
                  <Background
                    gap={16}
                    className="[&>*]:stroke-foreground-muted opacity-[25%]"
                    variant={BackgroundVariant.Dots}
                    color="inherit"
                  />
                </ReactFlow>
              </HeatmapContext.Provider>
            </MetricsVisibilityContext.Provider>
          </div>
        </div>
      </div>
    </>
  )

  const expandedPortal =
    isExpanded && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-50 flex">
            <div
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              aria-hidden="true"
              onClick={() => setIsExpanded(false)}
            />
            <div
              role="dialog"
              aria-modal="true"
              className="relative z-10 flex w-full bg-background"
            >
              <div
                className={cn(
                  'flex flex-col h-full w-full overflow-hidden border shadow-2xl',
                  className
                )}
              >
                {renderVisualizer(true)}
              </div>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <>
      {expandedPortal}
      <div
        className={cn(
          'w-full h-full flex flex-col',
          className,
          isExpanded && 'pointer-events-none select-none opacity-0'
        )}
        aria-hidden={isExpanded}
      >
        {renderVisualizer(false)}
      </div>
    </>
  )
}
