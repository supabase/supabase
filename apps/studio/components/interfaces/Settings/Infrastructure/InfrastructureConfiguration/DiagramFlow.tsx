import {
  Background,
  ColorMode,
  Edge,
  EdgeTypes,
  Node,
  NodeTypes,
  ReactFlow,
  useNodesInitialized,
  useReactFlow,
} from '@xyflow/react'
import { useTheme } from 'next-themes'
import { useEffect, useEffectEvent, useState } from 'react'

import '@xyflow/react/dist/style.css'

import { cn } from 'ui'

import { getDagreGraphLayout } from './InstanceConfiguration.utils'
import { timeout } from '@/lib/helpers'

interface DiagramFlowProps {
  nodes: Node[]
  edges: Edge[]
  nodeTypes: NodeTypes
  edgeTypes: EdgeTypes
  /** Prepends background group nodes (regions, shards) after the dagre layout runs */
  addGroupNodes: (nodes: Node[], edges: Edge[]) => { nodes: Node[]; edges: Edge[] }
  ranksep?: number
}

/**
 * Shared React Flow canvas for the infrastructure diagrams, laid out with a
 * two-pass measured dagre layout: the first pass uses fallback heights while
 * the diagram is held invisible, then `useNodesInitialized` triggers a second
 * pass that re-runs dagre with the real measured node heights before fading
 * the diagram in. Must be rendered inside a `ReactFlowProvider`.
 */
export const DiagramFlow = ({
  nodes,
  edges,
  nodeTypes,
  edgeTypes,
  addGroupNodes,
  ranksep,
}: DiagramFlowProps) => {
  const reactFlow = useReactFlow()
  const { resolvedTheme } = useTheme()
  const nodesInitialized = useNodesInitialized()
  const [hasMeasuredLayout, setHasMeasuredLayout] = useState(false)

  const backgroundPatternColor =
    resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)'

  const setReactFlow = useEffectEvent(async ({ measured }: { measured: boolean }) => {
    // Merge in React Flow's measured dimensions (if any) so dagre can use real
    // heights instead of the first-paint fallbacks.
    const measuredNodes = nodes.map((node) => {
      const existing = reactFlow.getNode(node.id)
      return existing?.measured ? { ...node, measured: existing.measured } : node
    })
    const graph = getDagreGraphLayout(measuredNodes, edges, { ranksep })
    const { nodes: updatedNodes } = addGroupNodes(graph.nodes, graph.edges)
    reactFlow.setNodes(updatedNodes)
    reactFlow.setEdges(graph.edges)

    // [Joshen] Odd fix to ensure that react flow snaps back to center when adding nodes
    await timeout(1)
    reactFlow.fitView({ maxZoom: 0.9, minZoom: 0.9 })
    if (measured) setHasMeasuredLayout(true)
  })

  // First pass: lay out using fallback heights for any not-yet-measured nodes.
  // The diagram is kept invisible until the measured pass below has run, so the
  // user never sees the fallback positions.
  useEffect(() => {
    if (nodes.length > 0) {
      setReactFlow({ measured: false })
    }
  }, [nodes, edges])

  // Second pass: once React Flow has measured the nodes, re-run the layout so
  // dagre uses real heights. Only `nodesInitialized` going true should trigger
  // this — the first-pass effect above handles node changes.
  const runMeasuredLayout = useEffectEvent(() => {
    if (nodesInitialized && nodes.length > 0) {
      setReactFlow({ measured: true })
    }
  })
  useEffect(() => {
    runMeasuredLayout()
  }, [nodesInitialized])

  return (
    <ReactFlow
      // FIXME: https://github.com/xyflow/xyflow/issues/4876
      colorMode={'' as unknown as ColorMode}
      fitView
      fitViewOptions={{ minZoom: 0.9, maxZoom: 0.9 }}
      // Keep the diagram invisible (but laid out, so nodes can be measured)
      // until the measured-height layout pass has run.
      className={cn(
        'instance-configuration transition-opacity duration-150',
        hasMeasuredLayout ? 'opacity-100' : 'opacity-0'
      )}
      zoomOnPinch={false}
      zoomOnScroll={false}
      nodesDraggable={false}
      nodesConnectable={false}
      zoomOnDoubleClick={false}
      edgesFocusable={false}
      edgesReconnectable={false}
      defaultNodes={[]}
      defaultEdges={[]}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      proOptions={{ hideAttribution: true }}
    >
      <Background color={backgroundPatternColor} />
    </ReactFlow>
  )
}
