import type { Edge, Node } from 'reactflow'
import { type ReactNode, Fragment, SetStateAction, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Minimize2 } from 'lucide-react'
import 'reactflow/dist/style.css'
import { Transition } from '@headlessui/react'

import type { PlanMeta, PlanNodeData } from './types'
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
import { NODE_TYPE } from './constants'
import {
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
import { usePlanLayoutState } from './hooks/use-plan-layout-state'
import { PlanViewport, type HeatmapExtents } from './plan-viewport'

type ExpandedLayoutProps = {
  containerClass: string
  sidebar: ReactNode | null
  planPanel: ReactNode
  detailPanel: ReactNode | null
}

const ExpandedLayout = ({
  containerClass,
  sidebar,
  planPanel,
  detailPanel,
}: ExpandedLayoutProps) => {
  const mainContent = sidebar ? (
    <ResizablePanelGroup direction="horizontal" className="flex h-full flex-1">
      {sidebar}
      <ResizableHandle withHandle className="hidden lg:flex" />
      <ResizablePanel defaultSize={80} minSize={45} className="flex flex-1">
        {planPanel}
      </ResizablePanel>
    </ResizablePanelGroup>
  ) : (
    <div className="flex flex-1">{planPanel}</div>
  )

  return (
    <div className={containerClass}>
      <div className="flex h-full">
        {mainContent}
        {detailPanel}
      </div>
    </div>
  )
}

type CollapsedLayoutProps = {
  containerClass: string
  planPanel: ReactNode
}

const CollapsedLayout = ({ containerClass, planPanel }: CollapsedLayoutProps) => (
  <div className={containerClass}>
    <div className="flex h-full">{planPanel}</div>
  </div>
)

type PlanLayoutState = ReturnType<typeof usePlanLayoutState>

type VisualizerBodyProps = {
  expanded: boolean
  meta?: PlanMeta
  layoutNodes: Node<PlanNodeData>[]
  layoutEdges: Edge[]
  metricsVisibility: MetricsVisibility
  setMetricsVisibility: (value: SetStateAction<MetricsVisibility>) => void
  heatmapMode: HeatmapMode
  setHeatmapMode: (value: SetStateAction<HeatmapMode>) => void
  heatmapExtents: HeatmapExtents
  nodeTypes: NonNullable<Parameters<typeof PlanViewport>[0]['nodeTypes']>
  planState: PlanLayoutState
}

const VisualizerBody = ({
  expanded,
  meta,
  layoutNodes,
  layoutEdges,
  metricsVisibility,
  setMetricsVisibility,
  heatmapMode,
  setHeatmapMode,
  heatmapExtents,
  nodeTypes,
  planState,
}: VisualizerBodyProps) => {
  const containerClass = cn(
    'relative h-full w-full bg-background',
    expanded ? 'border-none' : 'border rounded-md'
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
                  <p className="whitespace-pre-wrap text-foreground-lighter">{meta.errorDetail}</p>
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

  const {
    selectedNodeId,
    selectedNode,
    panelNode,
    nodesWithSelection,
    setRfInstance,
    clearSelection,
    handleSelectNode,
    handleSelectionChange,
    handleNodesChange,
    handleNodeDragStart,
    handleNodeDragStop,
    handleDetailPanelAfterLeave,
    toggleExpanded,
  } = planState

  const sidebarElement = expanded ? (
    <MetricsSidebar
      nodes={layoutNodes}
      edges={layoutEdges}
      meta={meta}
      selectedNodeId={selectedNodeId}
      onSelect={handleSelectNode}
    />
  ) : null

  const detailPanelExpanded =
    expanded && panelNode ? (
      <Transition
        as={Fragment}
        show={!!selectedNode}
        appear
        enter="transition-all duration-300 ease-out"
        enterFrom="w-0 opacity-0"
        enterTo="w-[380px] opacity-100"
        leave="transition-all duration-200 ease-in"
        leaveFrom="w-[380px] opacity-100"
        leaveTo="w-0 opacity-0"
        afterLeave={handleDetailPanelAfterLeave}
      >
        <div className="flex overflow-hidden">
          <NodeDetailsPanel node={panelNode} meta={meta} onClearSelection={clearSelection} />
        </div>
      </Transition>
    ) : null

  const detailPanelOverlay =
    !expanded && panelNode ? (
      <Transition
        as={Fragment}
        show={!!selectedNode}
        appear
        afterLeave={handleDetailPanelAfterLeave}
      >
        <div className="absolute inset-0 z-30 flex">
          <Transition.Child
            as={Fragment}
            enter="transform transition-all duration-300 ease-out"
            enterFrom="translate-x-full opacity-0"
            enterTo="translate-x-0 opacity-100"
            leave="transform transition-all duration-200 ease-in"
            leaveFrom="translate-x-0 opacity-100"
            leaveTo="translate-x-full opacity-0"
          >
            <div className="pointer-events-auto flex h-full w-full">
              <NodeDetailsPanel
                node={panelNode}
                meta={meta}
                onClearSelection={clearSelection}
                variant="overlay"
              />
            </div>
          </Transition.Child>
        </div>
      </Transition>
    ) : null

  const planPanel = (
    <div className="relative flex-1">
      {expanded && (
        <div className="flex h-[41px] w-full items-center gap-x-3 border-b border-border bg-sidebar px-3">
          <ControlsOverlay
            metricsVisibility={metricsVisibility}
            setMetricsVisibility={setMetricsVisibility}
            heatmapMode={heatmapMode}
            setHeatmapMode={setHeatmapMode}
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
      )}

      {expanded && (
        <div className="absolute left-3 top-[46px] z-20 md:hidden">
          <MetaOverlay
            planningTime={meta?.planningTime}
            executionTime={meta?.executionTime}
            jitTotalTime={meta?.jitTotalTime}
            className="border-none border-border bg-transparent px-2 py-1 text-[11px] shadow-sm"
          />
        </div>
      )}

      <PlanViewport
        nodes={nodesWithSelection}
        edges={layoutEdges}
        metricsVisibility={metricsVisibility}
        heatmapMode={heatmapMode}
        heatmapExtents={heatmapExtents}
        nodeTypes={nodeTypes}
        onNodeClick={handleSelectNode}
        onSelectionChange={handleSelectionChange}
        onNodesChange={handleNodesChange}
        onPaneClick={clearSelection}
        onNodeDragStart={handleNodeDragStart}
        onNodeDragStop={handleNodeDragStop}
        onInit={setRfInstance}
      />
      {detailPanelOverlay}
    </div>
  )

  if (expanded) {
    return (
      <ExpandedLayout
        containerClass={containerClass}
        sidebar={sidebarElement}
        planPanel={planPanel}
        detailPanel={detailPanelExpanded}
      />
    )
  }

  return <CollapsedLayout containerClass={containerClass} planPanel={planPanel} />
}

export const QueryPlanVisualizer = ({
  json,
  className,
  isExpanded,
  setIsExpanded,
  renderExpandedContent,
}: {
  json: string
  className?: string
  isExpanded: boolean
  setIsExpanded: (value: SetStateAction<boolean>) => void
  renderExpandedContent: (content: ReactNode) => ReactNode
}) => {
  const { nodes, edges, meta } = usePlanGraph(json)

  const [metricsVisibility, setMetricsVisibility] =
    useState<MetricsVisibility>(defaultMetricsVisibility)

  // Heatmap mode and maxima across nodes
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>(defaultHeatmapMeta.mode)
  const heatMax = useHeatmapMax(nodes)

  const layout = useDagreLayout(nodes, edges, metricsVisibility, heatmapMode)
  const planState = usePlanLayoutState({
    layoutNodes: layout.nodes,
    isExpanded,
    setIsExpanded,
  })

  const nodeTypes = useMemo(
    () => ({
      [NODE_TYPE]: PlanNode,
    }),
    []
  )

  const expandedContent = isExpanded ? (
    <div className={cn('flex h-full w-full flex-col', className)}>
      <VisualizerBody
        expanded
        meta={meta}
        layoutNodes={layout.nodes}
        layoutEdges={layout.edges}
        metricsVisibility={metricsVisibility}
        setMetricsVisibility={setMetricsVisibility}
        heatmapMode={heatmapMode}
        setHeatmapMode={setHeatmapMode}
        heatmapExtents={heatMax}
        nodeTypes={nodeTypes}
        planState={planState}
      />
    </div>
  ) : null

  const expandedView = expandedContent ? renderExpandedContent(expandedContent) : null

  return (
    <>
      {expandedView}
      <div
        className={cn(
          'w-full h-full flex flex-col',
          className,
          isExpanded && 'pointer-events-none select-none opacity-0'
        )}
        aria-hidden={isExpanded}
      >
        <VisualizerBody
          expanded={false}
          meta={meta}
          layoutNodes={layout.nodes}
          layoutEdges={layout.edges}
          metricsVisibility={metricsVisibility}
          setMetricsVisibility={setMetricsVisibility}
          heatmapMode={heatmapMode}
          setHeatmapMode={setHeatmapMode}
          heatmapExtents={heatMax}
          nodeTypes={nodeTypes}
          planState={planState}
        />
      </div>
    </>
  )
}
