import {
  Background,
  ColorMode,
  Edge,
  EdgeTypes,
  getNodesBounds,
  getViewportForBounds,
  Node,
  NodeTypes,
  ReactFlow,
  useNodesInitialized,
  useReactFlow,
  useStoreApi,
  type FitViewOptions,
} from '@xyflow/react'
import { useReducedMotion } from 'common'
import { useTheme } from 'next-themes'
import { useEffect, useEffectEvent, useRef, useState } from 'react'

import '@xyflow/react/dist/style.css'

import { cn } from 'ui'

import {
  getLayoutTransitionFrame,
  hasLayoutDelta,
  NODE_LAYOUT_ANIMATION_MS,
} from './DiagramFlow.utils'
import { getDagreGraphLayout } from './InstanceConfiguration.utils'
import { timeout } from '@/lib/helpers'

const DIAGRAM_ZOOM = 0.9
// React Flow's own fitView default, used when no padding is passed.
const DEFAULT_FIT_VIEW_PADDING = 0.1

interface DiagramFlowProps {
  nodes: Node[]
  edges: Edge[]
  /** Optional stable topology used only for positioning nodes. */
  layoutEdges?: Edge[]
  nodeTypes: NodeTypes
  edgeTypes: EdgeTypes
  /** Prepends background group nodes (regions, shards) after the dagre layout runs */
  addGroupNodes: (nodes: Node[], edges: Edge[]) => { nodes: Node[]; edges: Edge[] }
  ranksep?: number
  fitViewPadding?: FitViewOptions['padding']
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
  layoutEdges,
  nodeTypes,
  edgeTypes,
  addGroupNodes,
  ranksep,
  fitViewPadding,
}: DiagramFlowProps) => {
  const reactFlow = useReactFlow()
  const storeApi = useStoreApi()
  const prefersReducedMotion = useReducedMotion()
  const { resolvedTheme } = useTheme()
  const nodesInitialized = useNodesInitialized()
  const [hasMeasuredLayout, setHasMeasuredLayout] = useState(false)
  const layoutGenerationRef = useRef(0)
  const animationFrameRef = useRef<number | undefined>(undefined)

  const backgroundPatternColor =
    resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)'

  const cancelLayoutAnimation = () => {
    if (animationFrameRef.current !== undefined) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = undefined
    }
  }

  const fitDiagram = () => {
    reactFlow.fitView({ maxZoom: DIAGRAM_ZOOM, minZoom: DIAGRAM_ZOOM, padding: fitViewPadding })
  }

  // fitView measures the nodes currently in the store, so it can't target a
  // layout that's still animating. This pans straight to where fitView would
  // land for the final layout, moving the camera together with the nodes.
  const panToLayout = (targetNodes: Node[], duration: number) => {
    const { width, height } = storeApi.getState()
    const viewport = getViewportForBounds(
      getNodesBounds(targetNodes),
      width,
      height,
      DIAGRAM_ZOOM,
      DIAGRAM_ZOOM,
      fitViewPadding ?? DEFAULT_FIT_VIEW_PADDING
    )
    reactFlow.setViewport(viewport, { duration })
  }

  const setReactFlow = useEffectEvent(async ({ isMeasuredPass }: { isMeasuredPass: boolean }) => {
    const generation = ++layoutGenerationRef.current
    cancelLayoutAnimation()

    // Merge in React Flow's measured dimensions (if any) so dagre can use real
    // heights instead of the first-paint fallbacks.
    const measuredNodes = nodes.map((node) => {
      const existing = reactFlow.getNode(node.id)
      return existing?.measured ? { ...node, measured: existing.measured } : node
    })
    const graph = getDagreGraphLayout(measuredNodes, layoutEdges ?? edges, { ranksep })
    const { nodes: groupedNodes } = addGroupNodes(graph.nodes, edges)
    // Re-attach known measurements to the freshly created group nodes too —
    // handing setNodes an unmeasured node resets the store's nodesInitialized
    // flag, which would re-trigger the measured pass below on every re-measure
    // and loop forever (each iteration re-running fitView, so the diagram
    // snaps back to center and can't be panned).
    const updatedNodes = groupedNodes.map((node) => {
      if (node.measured !== undefined) return node
      const existing = reactFlow.getNode(node.id)
      return existing?.measured ? { ...node, measured: existing.measured } : node
    })

    const currentNodes = reactFlow.getNodes()
    const shouldAnimate =
      hasMeasuredLayout &&
      !prefersReducedMotion &&
      currentNodes.length > 0 &&
      hasLayoutDelta(currentNodes, updatedNodes)

    if (shouldAnimate) {
      const fromEdges = reactFlow.getEdges()
      const startedAt = performance.now()
      panToLayout(updatedNodes, NODE_LAYOUT_ANIMATION_MS)

      const step = (now: number) => {
        if (generation !== layoutGenerationRef.current) return
        const frame = getLayoutTransitionFrame({
          elapsedMs: now - startedAt,
          fromNodes: currentNodes,
          toNodes: updatedNodes,
          fromEdges,
          toEdges: edges,
        })
        reactFlow.setNodes(frame.nodes)
        reactFlow.setEdges(frame.edges)

        if (frame.isDone) {
          animationFrameRef.current = undefined
          if (isMeasuredPass) setHasMeasuredLayout(true)
          return
        }

        animationFrameRef.current = requestAnimationFrame(step)
      }

      animationFrameRef.current = requestAnimationFrame(step)
      return
    }

    reactFlow.setEdges(edges)
    reactFlow.setNodes(updatedNodes)

    if (generation !== layoutGenerationRef.current) return

    // Data-only updates (status, badges) should not yank the camera.
    if (hasMeasuredLayout && !hasLayoutDelta(currentNodes, updatedNodes)) {
      if (isMeasuredPass) setHasMeasuredLayout(true)
      return
    }

    // [Joshen] Odd fix to ensure that react flow snaps back to center when adding nodes
    await timeout(1)
    if (generation !== layoutGenerationRef.current) return
    fitDiagram()
    if (isMeasuredPass) setHasMeasuredLayout(true)
  })

  // First pass: lay out using fallback heights for any not-yet-measured nodes.
  // The diagram is kept invisible until the measured pass below has run, so the
  // user never sees the fallback positions.
  useEffect(() => {
    if (nodes.length > 0) {
      setReactFlow({ isMeasuredPass: false })
    }
  }, [nodes, edges, layoutEdges, fitViewPadding])

  // Second pass: once React Flow has measured the nodes, re-run the layout so
  // dagre uses real heights. Only `nodesInitialized` going true should trigger
  // this — the first-pass effect above handles node changes.
  const runMeasuredLayout = useEffectEvent(() => {
    if (nodesInitialized && nodes.length > 0) {
      setReactFlow({ isMeasuredPass: true })
    }
  })
  useEffect(() => {
    runMeasuredLayout()
  }, [nodesInitialized])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <ReactFlow
      // FIXME: https://github.com/xyflow/xyflow/issues/4876
      colorMode={'' as unknown as ColorMode}
      fitView
      fitViewOptions={{ minZoom: DIAGRAM_ZOOM, maxZoom: DIAGRAM_ZOOM, padding: fitViewPadding }}
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
