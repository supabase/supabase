import {
  Background,
  ColorMode,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesInitialized,
  useNodesState,
  useReactFlow,
  useUpdateNodeInternals,
  type NodeTypes,
} from '@xyflow/react'
import { useTheme } from 'next-themes'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { cn } from 'ui'

import { InfrastructureDiagramViewToggle } from './InfrastructureDiagramViewToggle'
import type { InfrastructureDiagramView } from './InfrastructureDiagramViewToggle'
import { InfrastructureGlobe } from './InfrastructureGlobe'

import '@xyflow/react/dist/style.css'

import { useInfrastructurePrototype } from '../InfrastructurePrototypeContext'
import {
  buildDiagramTableGroups,
  buildInfrastructureDiagramGraph,
  getInfrastructureDiagramEdgeStyles,
  relayoutDiagramNodes,
} from './InfrastructureDiagram.utils'
import { DatabaseGroupNode } from './nodes/DatabaseGroupNode'
import { DatabaseNode } from './nodes/DatabaseNode'
import { MultigatewayNode } from './nodes/MultigatewayNode'
import { timeout } from '@/lib/helpers'

const nodeTypes: NodeTypes = {
  database: DatabaseNode,
  databaseGroup: DatabaseGroupNode,
  multigateway: MultigatewayNode,
}

export const INFRASTRUCTURE_DIAGRAM_HEIGHT_CLASS = 'h-[400px] min-h-[400px]'
/** Matches `-mt-16` on the charts row below the diagram. */
export const INFRASTRUCTURE_CHARTS_OVERLAP_CLASS = 'pb-16'
/** Fades diagram content at the bottom without painting over it. */
export const INFRASTRUCTURE_DIAGRAM_BOTTOM_FADE_CLASS =
  '[mask-image:linear-gradient(to_bottom,black_calc(100%-4rem),transparent_100%)]'

const buildActiveShardByGroup = (
  tableGroups: ReturnType<typeof buildDiagramTableGroups>
): Record<string, string> =>
  Object.fromEntries(
    tableGroups.map((tableGroup) => [tableGroup.id, tableGroup.shards[0]?.id ?? ''])
  )

const FIT_VIEW_PADDING = 0.4

const InfrastructureDiagramFlow = () => {
  const reactFlow = useReactFlow()
  const updateNodeInternals = useUpdateNodeInternals()
  const nodesInitialized = useNodesInitialized()
  const { config } = useInfrastructurePrototype()
  const { resolvedTheme } = useTheme()
  const tableGroups = useMemo(() => buildDiagramTableGroups(config), [config])
  const activeShardByGroup = useMemo(() => buildActiveShardByGroup(tableGroups), [tableGroups])

  const edgeStyles = useMemo(
    () => getInfrastructureDiagramEdgeStyles(resolvedTheme === 'dark'),
    [resolvedTheme]
  )

  const layoutSignature = useMemo(
    () =>
      [
        config.regions.join(','),
        config.availability.enabled,
        config.availability.level,
        config.scaling.enabled,
        config.scaling.computeSize,
        config.scaling.multigresSku,
        tableGroups
          .map((tableGroup) => `${tableGroup.id}:${tableGroup.shards.length}:${tableGroup.name}`)
          .join('|'),
        Object.entries(activeShardByGroup)
          .map(([tableGroupId, shardId]) => `${tableGroupId}=${shardId}`)
          .join('|'),
      ].join('::'),
    [
      activeShardByGroup,
      config.availability.enabled,
      config.availability.level,
      config.regions,
      config.scaling.computeSize,
      config.scaling.enabled,
      config.scaling.multigresSku,
      tableGroups,
    ]
  )

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () =>
      buildInfrastructureDiagramGraph({
        config,
        activeShardByGroup,
        edgeStyles,
      }),
    [activeShardByGroup, config, edgeStyles]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const layoutSignatureRef = useRef(layoutSignature)
  const hasMeasuredLayoutRef = useRef(false)

  useLayoutEffect(() => {
    if (layoutSignatureRef.current !== layoutSignature) {
      layoutSignatureRef.current = layoutSignature
      hasMeasuredLayoutRef.current = false
    }

    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialEdges, initialNodes, layoutSignature, setEdges, setNodes])

  const areDiagramNodesReadyForLayout = useCallback(() => {
    return tableGroups.every((tableGroup) => {
      const activeShardId = activeShardByGroup[tableGroup.id] ?? tableGroup.shards[0]?.id
      const activeShard = tableGroup.shards.find((shard) => shard.id === activeShardId)
      if (!activeShard) return false

      const flowNodes = reactFlow.getNodes()
      const primaryNode = flowNodes.find((node) => node.id === `${activeShardId}-primary`)
      const replicaNodes = flowNodes.filter((node) =>
        node.id.startsWith(`${activeShardId}-replica-`)
      )

      if (!primaryNode?.measured?.height) return false
      if (replicaNodes.length !== activeShard.replicas.length) return false

      return replicaNodes.every((node) => node.measured?.height)
    })
  }, [activeShardByGroup, reactFlow, tableGroups])

  useEffect(() => {
    if (!nodesInitialized || hasMeasuredLayoutRef.current) return

    let cancelled = false
    let frameId = 0

    const applyMeasuredLayout = async () => {
      if (cancelled || hasMeasuredLayoutRef.current) return

      if (!areDiagramNodesReadyForLayout()) {
        frameId = requestAnimationFrame(applyMeasuredLayout)
        return
      }

      const measuredNodes = reactFlow.getNodes().map((node) => {
        const measured = reactFlow.getNode(node.id)?.measured
        return measured ? { ...node, measured } : node
      })

      const relayoutedNodes = relayoutDiagramNodes(measuredNodes, tableGroups, activeShardByGroup)
      hasMeasuredLayoutRef.current = true
      setNodes(relayoutedNodes)
      relayoutedNodes.forEach((node) => updateNodeInternals(node.id))
      setEdges(initialEdges)
      await timeout(1)
      reactFlow.fitView({ padding: FIT_VIEW_PADDING, minZoom: 0.3, maxZoom: 1 })
    }

    applyMeasuredLayout()

    return () => {
      cancelled = true
      cancelAnimationFrame(frameId)
    }
  }, [
    activeShardByGroup,
    areDiagramNodesReadyForLayout,
    initialEdges,
    initialNodes,
    layoutSignature,
    nodesInitialized,
    reactFlow,
    setEdges,
    setNodes,
    tableGroups,
    updateNodeInternals,
  ])

  const backgroundPatternColor =
    resolvedTheme === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.4)'

  const proOptions = useMemo(() => ({ hideAttribution: true }), [])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: FIT_VIEW_PADDING }}
      proOptions={proOptions}
      // FIXME: https://github.com/xyflow/xyflow/issues/4876
      colorMode={'' as unknown as ColorMode}
      className="bg h-full w-full"
      minZoom={0.3}
      maxZoom={2}
      zoomOnPinch={false}
      zoomOnScroll={false}
      nodesDraggable={false}
      nodesConnectable={false}
      zoomOnDoubleClick={false}
      edgesFocusable={false}
      edgesReconnectable={false}
    >
      <Background color={backgroundPatternColor} />
    </ReactFlow>
  )
}

export const InfrastructureDiagram = ({
  embedded,
  bottomOverlap,
}: {
  embedded?: boolean
  bottomOverlap?: boolean
} = {}) => {
  const [view, setView] = useState<InfrastructureDiagramView>('diagram')
  const isDiagramView = view === 'diagram'

  const diagramContent = isDiagramView ? (
    <ReactFlowProvider>
      <InfrastructureDiagramFlow />
    </ReactFlowProvider>
  ) : (
    <InfrastructureGlobe />
  )

  if (embedded) {
    return (
      <div className="nowheel relative h-full w-full overflow-hidden">
        <div className="absolute inset-0 h-full w-full">{diagramContent}</div>

        <div className="absolute bottom-3 left-3 z-10">
          <InfrastructureDiagramViewToggle view={view} onViewChange={setView} />
        </div>
      </div>
    )
  }

  if (bottomOverlap) {
    return (
      <div
        className={cn(
          'nowheel relative w-full shrink-0 overflow-visible border-y border-default',
          INFRASTRUCTURE_CHARTS_OVERLAP_CLASS
        )}
      >
        <div className={cn('relative', INFRASTRUCTURE_DIAGRAM_HEIGHT_CLASS)}>
          <div
            className={cn(
              'absolute inset-0 h-full w-full',
              INFRASTRUCTURE_DIAGRAM_BOTTOM_FADE_CLASS
            )}
          >
            {diagramContent}
          </div>

          <div className="absolute bottom-3 left-3 z-10">
            <InfrastructureDiagramViewToggle view={view} onViewChange={setView} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'nowheel relative w-full shrink-0 overflow-hidden border-y border-default',
        INFRASTRUCTURE_DIAGRAM_HEIGHT_CLASS
      )}
    >
      <div className={cn('absolute inset-0 w-full', INFRASTRUCTURE_DIAGRAM_HEIGHT_CLASS)}>
        {diagramContent}
      </div>

      <div className="absolute bottom-3 left-3 z-10">
        <InfrastructureDiagramViewToggle view={view} onViewChange={setView} />
      </div>
    </div>
  )
}
