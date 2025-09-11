import { useTheme } from 'next-themes'
import { useMemo, useState } from 'react'
import ReactFlow, { Background, BackgroundVariant, MiniMap, type Node, type Edge } from 'reactflow'
import 'reactflow/dist/style.css'

import type { PlanMeta, PlanNodeData } from './types'
import { cn } from 'ui'
import { MetaOverlay } from './meta-overlay'
import { SubplanOverlay } from './subplan-overlay'
import { ControlsOverlay } from './controls-overlay'
import { NODE_TYPE } from './constants'
import {
  MetricsVisibilityContext,
  HeatmapContext,
  type MetricsVisibility,
  type HeatmapMode,
} from './contexts'
import { PlanNode } from './plan-node'
import { useHeatmapMax } from './hooks/use-heatmap-max'
import { buildGraphFromPlan } from './graph/build-graph-from-plan'
import { getLayoutedElementsViaDagre } from './utils/layout'
import { estimateNodeHeight } from './utils/node-display'
import { DetailsPanel } from './details-panel'

export const QueryPlanVisualizer = ({ json, className }: { json: string; className?: string }) => {
  const { nodes, edges, meta } = useMemo((): {
    nodes: Node<PlanNodeData>[]
    edges: Edge[]
    meta?: PlanMeta
  } => {
    try {
      const parsed = JSON.parse(json) as any
      const root = Array.isArray(parsed) ? parsed[0] : parsed
      const meta: PlanMeta = {
        planningTime:
          typeof root?.['Planning Time'] === 'number' ? root['Planning Time'] : undefined,
        executionTime:
          typeof root?.['Execution Time'] === 'number' ? root['Execution Time'] : undefined,
        jitTotalTime:
          typeof root?.JIT?.Timing?.Total === 'number'
            ? root.JIT.Timing.Total
            : typeof root?.JIT?.['Total Time'] === 'number'
              ? root.JIT['Total Time']
              : undefined,
      }
      const planPart = root?.Plan ? [root] : parsed
      const graph = buildGraphFromPlan(planPart, { executionTime: meta.executionTime })
      if (!graph.nodes.length) {
        return {
          nodes: [],
          edges: [],
          meta: {
            ...meta,
            errorMessage: 'Invalid EXPLAIN JSON: Plan node not found.',
            errorDetail:
              'Provide output from EXPLAIN (FORMAT JSON) or EXPLAIN (ANALYZE, FORMAT JSON). The root should be an array and its first element must contain a "Plan" object.',
          },
        }
      }
      return {
        nodes: graph.nodes,
        edges: graph.edges,
        meta: { ...meta, subplanRoots: graph.subplanRoots },
      }
    } catch (e: any) {
      return {
        nodes: [],
        edges: [],
        meta: {
          errorMessage: 'Failed to parse JSON',
          errorDetail:
            (e?.message ? e.message : '') + '\nPaste valid JSON from EXPLAIN (FORMAT JSON).',
        },
      }
    }
  }, [json])

  const [metricsVisibility, setMetricsVisibility] = useState<MetricsVisibility>({
    time: true,
    rows: true,
    cost: true,
    buffers: true,
    output: true,
  })

  // Heatmap mode and maxima across nodes
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('none')
  const heatMax = useHeatmapMax(nodes as Node<PlanNodeData>[])

  const [selectedNode, setSelectedNode] = useState<PlanNodeData | null>(null)

  // Estimate node sizes from data (fixed row heights) and layout with Dagre
  const layout = useMemo(() => {
    if (!nodes.length) return { nodes: [], edges: [] }

    const sizes: Record<string, { width: number; height: number }> = {}

    nodes.forEach((n) => {
      const d = n.data
      const height = estimateNodeHeight(d, metricsVisibility, heatmapMode)
      sizes[n.id] = { width: 180, height }
    })

    const { nodes: nl, edges: el } = getLayoutedElementsViaDagre(
      nodes.map((n) => ({ ...n })),
      edges.map((e) => ({ ...e })),
      sizes
    )
    return { nodes: nl, edges: el }
  }, [nodes, edges, metricsVisibility, heatmapMode])

  const { resolvedTheme } = useTheme()
  const miniMapMaskColor = resolvedTheme?.includes('dark')
    ? 'rgb(17, 19, 24, .8)'
    : 'rgb(237, 237, 237, .8)'

  const nodeTypes = useMemo(
    () => ({
      [NODE_TYPE]: PlanNode,
    }),
    []
  )

  return (
    <div className={cn('w-full h-full border relative', className)}>
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
      <MetaOverlay
        planningTime={meta?.planningTime}
        executionTime={meta?.executionTime}
        jitTotalTime={meta?.jitTotalTime}
      />
      <SubplanOverlay subplanRoots={meta?.subplanRoots} />
      <ControlsOverlay
        metricsVisibility={metricsVisibility}
        setMetricsVisibility={(updater) => setMetricsVisibility(updater)}
        heatmapMode={heatmapMode}
        setHeatmapMode={(m) => setHeatmapMode(m)}
      />
      {selectedNode && (
        <DetailsPanel selectedNode={selectedNode} setSelectedNode={setSelectedNode} />
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
            onNodeClick={(e, node) => setSelectedNode(node.data as PlanNodeData)}
            onPaneClick={() => setSelectedNode(null)}
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
              nodeColor="#111318"
              maskColor={miniMapMaskColor}
              className="border rounded-md shadow-sm"
            />
          </ReactFlow>
        </HeatmapContext.Provider>
      </MetricsVisibilityContext.Provider>
    </div>
  )
}
