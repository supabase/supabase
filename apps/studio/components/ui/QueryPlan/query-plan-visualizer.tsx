import { useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, { Background, BackgroundVariant, type ReactFlowInstance } from 'reactflow'
import { Maximize2, Minimize2 } from 'lucide-react'
import 'reactflow/dist/style.css'

import type { PlanNodeData } from './types'
import { Button, cn } from 'ui'
import { MetaOverlay } from './meta-overlay'
import { ControlsOverlay } from './controls-overlay'
import { NODE_TYPE } from './constants'
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
import { DetailsPanel } from './details-panel'
import { usePlanGraph } from './hooks/use-plan-graph'
import { useFullscreen } from './hooks/use-fullscreen'
import { useDagreLayout } from './hooks/use-dagre-layout'

export const QueryPlanVisualizer = ({ json, className }: { json: string; className?: string }) => {
  const { nodes, edges, meta } = usePlanGraph(json)

  const [metricsVisibility, setMetricsVisibility] =
    useState<MetricsVisibility>(defaultMetricsVisibility)

  // Heatmap mode and maxima across nodes
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>(defaultHeatmapMeta.mode)
  const heatMax = useHeatmapMax(nodes)

  const [selectedNode, setSelectedNode] = useState<PlanNodeData | null>(null)
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef)
  const layout = useDagreLayout(nodes, edges, metricsVisibility, heatmapMode)

  useEffect(() => {
    requestAnimationFrame(() => rfInstance?.fitView())
  }, [isFullscreen, rfInstance])

  const nodeTypes = useMemo(
    () => ({
      [NODE_TYPE]: PlanNode,
    }),
    []
  )

  return (
    <div className={cn('w-full h-full flex flex-col', className)}>
      {!isFullscreen && (
        <ControlsOverlay
          metricsVisibility={metricsVisibility}
          setMetricsVisibility={setMetricsVisibility}
          heatmapMode={heatmapMode}
          setHeatmapMode={setHeatmapMode}
          variant="toolbar"
          className="mb-2"
        />
      )}
      <div ref={containerRef} className="relative w-full h-full border rounded-md bg-background">
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
        <div className="absolute z-10 top-2 left-2 right-2 flex items-center justify-start pr-8 gap-x-2">
          {isFullscreen && (
            <ControlsOverlay
              metricsVisibility={metricsVisibility}
              setMetricsVisibility={setMetricsVisibility}
              heatmapMode={heatmapMode}
              setHeatmapMode={setHeatmapMode}
              variant="overlay"
              portal={false}
            />
          )}
          <MetaOverlay
            planningTime={meta?.planningTime}
            executionTime={meta?.executionTime}
            jitTotalTime={meta?.jitTotalTime}
            className={isFullscreen ? 'p-2' : 'text-[10px]'}
          />
        </div>

        {selectedNode && (
          <DetailsPanel
            selectedNode={selectedNode}
            setSelectedNode={setSelectedNode}
            isFullscreen={isFullscreen}
          />
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
              nodes={layout.nodes}
              edges={layout.edges}
              minZoom={0.8}
              maxZoom={1.8}
              proOptions={{ hideAttribution: true }}
              onNodeClick={(_event, node) => setSelectedNode(node.data)}
              onPaneClick={() => setSelectedNode(null)}
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
        <Button
          type="default"
          size="tiny"
          icon={
            isFullscreen ? (
              <Minimize2 size={14} className="text-foreground" />
            ) : (
              <Maximize2 size={14} className="text-foreground" />
            )
          }
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="absolute top-2 right-2 z-10 inline-flex items-center justify-center h-7 w-7 rounded-md border bg-foreground-muted/20 hover:bg-foreground-muted/30"
        />
      </div>
    </div>
  )
}
