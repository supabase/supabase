import type { PropsWithChildren } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  type Edge,
  type Node,
  type OnSelectionChangeParams,
  type ReactFlowInstance,
} from 'reactflow'

import type { PlanNodeData } from './types'
import {
  MetricsVisibilityContext,
  HeatmapContext,
  type MetricsVisibility,
  type HeatmapMode,
} from './contexts'
import { cn } from 'ui'

export type HeatmapExtents = {
  maxTime: number
  maxRows: number
  maxCost: number
}

type PlanViewportProps = PropsWithChildren<{
  nodes: Node<PlanNodeData>[]
  edges: Edge[]
  metricsVisibility: MetricsVisibility
  heatmapMode: HeatmapMode
  heatmapExtents: HeatmapExtents
  nodeTypes: NonNullable<Parameters<typeof ReactFlow>[0]['nodeTypes']>
  onNodeClick: (node: Node<PlanNodeData>) => void
  onSelectionChange: (params: OnSelectionChangeParams) => void
  onPaneClick: () => void
  onNodeDragStart: (event: unknown, node: Node<PlanNodeData>) => void
  onNodeDragStop: (event: unknown, node: Node<PlanNodeData>) => void
  onInit: (instance: ReactFlowInstance) => void
  minZoom?: number
  maxZoom?: number
  className?: string
}>

export const PlanViewport = ({
  nodes,
  edges,
  metricsVisibility,
  heatmapMode,
  heatmapExtents,
  nodeTypes,
  onNodeClick,
  onSelectionChange,
  onPaneClick,
  onNodeDragStart,
  onNodeDragStop,
  onInit,
  minZoom = 0.8,
  maxZoom = 1.8,
  className,
  children,
}: PlanViewportProps) => {
  return (
    <MetricsVisibilityContext.Provider value={metricsVisibility}>
      <HeatmapContext.Provider
        value={{
          mode: heatmapMode,
          maxTime: heatmapExtents.maxTime,
          maxRows: heatmapExtents.maxRows,
          maxCost: heatmapExtents.maxCost,
        }}
      >
        <ReactFlow
          className={cn('rounded-md', className)}
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
          nodes={nodes}
          edges={edges}
          minZoom={minZoom}
          maxZoom={maxZoom}
          proOptions={{ hideAttribution: true }}
          onNodeClick={(_event, node) => onNodeClick(node)}
          onSelectionChange={onSelectionChange}
          onPaneClick={onPaneClick}
          onNodeDragStart={onNodeDragStart}
          onNodeDragStop={onNodeDragStop}
          onInit={onInit}
        >
          <Background
            gap={16}
            className="opacity-[25%] [&>*]:stroke-foreground-muted"
            variant={BackgroundVariant.Dots}
            color="inherit"
          />
          {children}
        </ReactFlow>
      </HeatmapContext.Provider>
    </MetricsVisibilityContext.Provider>
  )
}
