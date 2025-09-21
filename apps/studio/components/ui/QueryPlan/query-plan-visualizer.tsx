import Link from 'next/link'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import ReactFlow, {
  Background,
  BackgroundVariant,
  type Node,
  type ReactFlowInstance,
} from 'reactflow'
import { BookOpen, Maximize2, Minimize2 } from 'lucide-react'
import 'reactflow/dist/style.css'
import { Transition } from '@headlessui/react'

import type { PlanNodeData } from './types'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  cn,
} from 'ui'
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
import { NodeDetailsPanel } from './node-details-panel'

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
  const [panelNode, setPanelNode] = useState<Node<PlanNodeData> | null>(null)
  const layout = useDagreLayout(nodes, edges, metricsVisibility, heatmapMode)

  useEffect(() => {
    if (!isExpanded || !rfInstance) return

    let frameId: number | null = null
    let secondFrameId: number | null = null

    // Delay fitView until after the layout has settled with the detail panel width.
    frameId = requestAnimationFrame(() => {
      secondFrameId = requestAnimationFrame(() => {
        rfInstance.fitView()
      })
    })

    return () => {
      if (frameId) cancelAnimationFrame(frameId)
      if (secondFrameId) cancelAnimationFrame(secondFrameId)
    }
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

  const handleSelectNode = useCallback((node: Node<PlanNodeData>) => {
    setSelectedNodeId(node.id)
  }, [])

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

  const selectedNode = useMemo(
    () => layout.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [layout.nodes, selectedNodeId]
  )

  useEffect(() => {
    if (selectedNode) {
      setPanelNode(selectedNode)
    }
  }, [selectedNode])

  useEffect(() => {
    if (!selectedNodeId || !rfInstance) return

    let frameId: number | null = null
    let secondFrameId: number | null = null

    // Wait an extra frame so React Flow recalculates node positions after sidebar resizing.
    frameId = requestAnimationFrame(() => {
      secondFrameId = requestAnimationFrame(() => {
        centerNodeInView(selectedNodeId)
      })
    })

    return () => {
      if (frameId !== null) cancelAnimationFrame(frameId)
      if (secondFrameId !== null) cancelAnimationFrame(secondFrameId)
    }
  }, [centerNodeInView, rfInstance, selectedNodeId])

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

  const renderVisualizer = (isExpanded: boolean) => {
    const sidebarElement = isExpanded ? (
      <MetricsSidebar
        nodes={layout.nodes}
        edges={layout.edges}
        meta={meta}
        selectedNodeId={selectedNodeId}
        onSelect={handleSelectNode}
      />
    ) : null

    const detailPanelElement =
      isExpanded && panelNode ? (
        <Transition
          as={Fragment}
          show={Boolean(selectedNode)}
          appear
          enter="transition-all duration-300 ease-out"
          enterFrom="w-0 opacity-0"
          enterTo="w-[350px] opacity-100"
          leave="transition-all duration-200 ease-in"
          leaveFrom="w-[350px] opacity-100"
          leaveTo="w-0 opacity-0"
          afterLeave={() => setPanelNode(null)}
        >
          <div className="hidden xl:flex overflow-hidden">
            <NodeDetailsPanel
              node={panelNode}
              meta={meta}
              onClearSelection={() => setSelectedNodeId(null)}
            />
          </div>
        </Transition>
      ) : null

    const planPanel = (
      <div className="relative flex-1">
        {isExpanded ? (
          <div className="flex h-[41px] w-full items-center gap-x-3 border-b border-border bg-sidebar px-3">
            <ControlsOverlay
              metricsVisibility={metricsVisibility}
              setMetricsVisibility={setMetricsVisibility}
              heatmapMode={heatmapMode}
              setHeatmapMode={setHeatmapMode}
              variant="toolbar"
              portal={false}
              className="shrink-0"
            />
            <div className="hidden h-[20px] w-px border-r border-control md:block" />
            <MetaOverlay
              planningTime={meta?.planningTime}
              executionTime={meta?.executionTime}
              jitTotalTime={meta?.jitTotalTime}
              className="hidden h-full flex-1 items-center border-0 bg-transparent px-0 py-0 text-xs md:flex"
            />

            <div className="ml-auto flex items-center gap-x-2">
              <Button asChild type="default" size="tiny" icon={<BookOpen />} className="h-[28px]">
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
          </div>
        ) : (
          <div className="absolute left-2.5 right-2.5 top-2.5 z-20 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-md border border-border bg-sidebar px-2.5 py-1.5 shadow-sm">
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
          <div className="absolute left-3 top-[46px] z-20 md:hidden">
            <MetaOverlay
              planningTime={meta?.planningTime}
              executionTime={meta?.executionTime}
              jitTotalTime={meta?.jitTotalTime}
              className="border-none border-border bg-transparent px-2 py-1 text-[11px] shadow-sm"
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
                className="opacity-[25%] [&>*]:stroke-foreground-muted"
                variant={BackgroundVariant.Dots}
                color="inherit"
              />
            </ReactFlow>
          </HeatmapContext.Provider>
        </MetricsVisibilityContext.Provider>
      </div>
    )

    const containerClass = cn(
      'relative h-full w-full bg-background',
      isExpanded ? 'border-none' : 'border rounded-md'
    )

    if (meta?.errorMessage) {
      return (
        <div className={containerClass}>
          <div className="flex h-full items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
              <Alert_Shadcn_ variant="destructive">
                <AlertTitle_Shadcn_>{meta.errorMessage}</AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_ className="space-y-3 text-sm">
                  {meta.errorDetail && (
                    <p className="whitespace-pre-wrap text-foreground-lighter">
                      {meta.errorDetail}
                    </p>
                  )}
                  <Button asChild type="default" size="tiny">
                    <Link href="/support/new" target="_blank" rel="noreferrer">
                      Contact support
                    </Link>
                  </Button>
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            </div>
          </div>
        </div>
      )
    }

    if (isExpanded) {
      const mainContent = sidebarElement ? (
        <ResizablePanelGroup direction="horizontal" className="flex h-full flex-1">
          {sidebarElement}
          <ResizableHandle withHandle className="hidden lg:flex" />
          <ResizablePanel defaultSize={72} minSize={45} className="flex flex-1">
            {planPanel}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <div className="flex flex-1">{planPanel}</div>
      )

      return (
        <>
          <div className={containerClass}>
            <div className="flex h-full">
              {mainContent}
              {detailPanelElement}
            </div>
          </div>
        </>
      )
    }

    return (
      <>
        <div className={containerClass}>
          <div className="flex h-full">{planPanel}</div>
        </div>
      </>
    )
  }

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
