import { useCallback, useEffect, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  ConnectionLineType,
  Node,
} from 'reactflow'
import { toPng, toSvg } from 'html-to-image'
import AlertError from 'components/ui/AlertError'
import { useDependencyGraphQuery } from 'data/dependency-graph/dependency-graph-query'
import type { DependencyGraphNodeType } from 'data/dependency-graph/dependency-graph-query'
import { useSchemasQuery } from 'data/database/schemas-query'
import { useQuerySchemaState } from 'hooks/misc/useSchemaQueryState'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { SchemaGraphNode } from './SchemaGraphNode'
import { SchemaGraphControls } from './SchemaGraphControls'
import { NODE_TYPE_COLORS } from './types'
import type { SchemaGraphNode as SchemaGraphNodeType, SchemaGraphEdge } from './types'

import 'reactflow/dist/style.css'

const nodeTypes = {
  schemaNode: SchemaGraphNode,
}

// Dagre layout helper
function getLayoutedElements(
  nodes: SchemaGraphNodeType[],
  edges: SchemaGraphEdge[],
  direction = 'LR'
) {
  // Simple force-directed layout simulation
  const nodeWidth = 180
  const nodeHeight = 80
  const padding = 50

  // Group nodes by type for better organization
  const nodesByType = new Map<string, SchemaGraphNodeType[]>()
  nodes.forEach((node) => {
    const type = node.data.type
    if (!nodesByType.has(type)) {
      nodesByType.set(type, [])
    }
    nodesByType.get(type)!.push(node)
  })

  // Layout nodes in rows by type
  let yOffset = padding
  const typeOrder = [
    'table',
    'view',
    'materialized_view',
    'function',
    'trigger',
    'policy',
    'index',
    'sequence',
    'type',
  ]

  const positionedNodes: SchemaGraphNodeType[] = []

  typeOrder.forEach((type) => {
    const typeNodes = nodesByType.get(type) || []
    if (typeNodes.length === 0) return

    const cols = Math.ceil(Math.sqrt(typeNodes.length * 2))
    typeNodes.forEach((node, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      positionedNodes.push({
        ...node,
        position: {
          x: padding + col * (nodeWidth + padding),
          y: yOffset + row * (nodeHeight + padding),
        },
      })
    })

    const rows = Math.ceil(typeNodes.length / cols)
    yOffset += rows * (nodeHeight + padding) + padding * 2
  })

  return { nodes: positionedNodes, edges }
}

function SchemaGraphInner() {
  const { data: project } = useSelectedProjectQuery()
  const { selectedSchema, setSelectedSchema } = useQuerySchemaState()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const { fitView, zoomIn, zoomOut, getNodes } = useReactFlow()

  const [search, setSearch] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<DependencyGraphNodeType[]>([
    'table',
    'view',
    'materialized_view',
    'function',
    'trigger',
    'policy',
    'index',
  ])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  const {
    data: graphData,
    error: graphError,
    isLoading: isLoadingGraph,
    isError: isErrorGraph,
  } = useDependencyGraphQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    includedSchemas: selectedSchema ? [selectedSchema] : undefined,
    includedTypes: selectedTypes.length > 0 ? selectedTypes : undefined,
  })

  const {
    data: schemas,
    isLoading: isLoadingSchemas,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  // Transform data to React Flow format
  useEffect(() => {
    if (!graphData) return

    const searchLower = search.toLowerCase()

    // Create nodes
    const flowNodes: SchemaGraphNodeType[] = graphData.nodes
      .filter((node) => {
        if (!search) return true
        return (
          node.name.toLowerCase().includes(searchLower) ||
          node.schema.toLowerCase().includes(searchLower) ||
          (node.comment?.toLowerCase().includes(searchLower) ?? false)
        )
      })
      .map((node) => ({
        id: String(node.id),
        type: 'schemaNode',
        position: { x: 0, y: 0 },
        data: {
          ...node,
          highlighted: false,
          dimmed: false,
        },
      }))

    // Create edges
    const nodeIds = new Set(flowNodes.map((n) => n.id))
    const flowEdges: SchemaGraphEdge[] = graphData.edges
      .filter((edge) => nodeIds.has(String(edge.source)) && nodeIds.has(String(edge.target)))
      .map((edge) => ({
        id: edge.id,
        source: String(edge.source),
        target: String(edge.target),
        type: 'smoothstep',
        animated: edge.type === 'fk',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
        },
        data: {
          type: edge.type,
          label: edge.label,
          highlighted: false,
          dimmed: false,
        },
        style: {
          stroke: '#64748b',
          strokeWidth: 1.5,
        },
        label: edge.label || undefined,
        labelStyle: { fontSize: 10, fill: '#94a3b8' },
        labelBgStyle: { fill: 'var(--colors-surface-100)', fillOpacity: 0.8 },
      }))

    // Apply layout
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      flowNodes,
      flowEdges
    )

    setNodes(layoutedNodes)
    setEdges(layoutedEdges)

    // Fit view after layout
    setTimeout(() => fitView({ padding: 0.1 }), 100)
  }, [graphData, search, setNodes, setEdges, fitView])

  // Handle node selection for dependency highlighting
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const nodeId = node.id

      if (selectedNodeId === nodeId) {
        // Deselect - reset all highlights
        setSelectedNodeId(null)
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            data: { ...n.data, highlighted: false, dimmed: false },
          }))
        )
        setEdges((eds) =>
          eds.map((e) => ({
            ...e,
            data: { ...e.data, highlighted: false, dimmed: false },
            style: { ...e.style, stroke: '#64748b', strokeWidth: 1.5 },
          }))
        )
        return
      }

      setSelectedNodeId(nodeId)

      // Find connected nodes (both directions)
      const connectedNodeIds = new Set<string>([nodeId])
      const highlightedEdgeIds = new Set<string>()

      edges.forEach((edge) => {
        if (edge.source === nodeId || edge.target === nodeId) {
          connectedNodeIds.add(edge.source)
          connectedNodeIds.add(edge.target)
          highlightedEdgeIds.add(edge.id)
        }
      })

      // Update nodes
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            highlighted: n.id === nodeId,
            dimmed: !connectedNodeIds.has(n.id),
          },
        }))
      )

      // Update edges
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          data: {
            ...e.data,
            highlighted: highlightedEdgeIds.has(e.id),
            dimmed: !highlightedEdgeIds.has(e.id),
          },
          style: {
            ...e.style,
            stroke: highlightedEdgeIds.has(e.id) ? '#3b82f6' : '#64748b',
            strokeWidth: highlightedEdgeIds.has(e.id) ? 2.5 : 1.5,
            opacity: highlightedEdgeIds.has(e.id) ? 1 : 0.2,
          },
        }))
      )
    },
    [selectedNodeId, edges, setNodes, setEdges]
  )

  // Export functions
  const exportToPNG = useCallback(() => {
    if (!reactFlowWrapper.current) return
    const flowElement = reactFlowWrapper.current.querySelector('.react-flow') as HTMLElement
    if (!flowElement) return

    toPng(flowElement, {
      backgroundColor: '#1a1a1a',
      width: flowElement.offsetWidth,
      height: flowElement.offsetHeight,
    }).then((dataUrl) => {
      const link = document.createElement('a')
      link.download = `schema-graph-${selectedSchema || 'all'}.png`
      link.href = dataUrl
      link.click()
    })
  }, [selectedSchema])

  const exportToSVG = useCallback(() => {
    if (!reactFlowWrapper.current) return
    const flowElement = reactFlowWrapper.current.querySelector('.react-flow') as HTMLElement
    if (!flowElement) return

    toSvg(flowElement, {
      backgroundColor: '#1a1a1a',
    }).then((dataUrl) => {
      const link = document.createElement('a')
      link.download = `schema-graph-${selectedSchema || 'all'}.svg`
      link.href = dataUrl
      link.click()
    })
  }, [selectedSchema])

  if (isLoadingGraph || isLoadingSchemas) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <GenericSkeletonLoader />
      </div>
    )
  }

  if (isErrorGraph) {
    return (
      <div className="w-full h-full flex items-center justify-center p-8">
        <AlertError error={graphError} subject="Failed to load dependency graph" />
      </div>
    )
  }

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
        }}
      >
        <Background color="#374151" gap={20} />
        <MiniMap
          nodeColor={(node) => NODE_TYPE_COLORS[node.data?.type as string] || '#64748b'}
          nodeStrokeWidth={3}
          zoomable
          pannable
        />
        <SchemaGraphControls
          selectedSchema={selectedSchema}
          onSchemaChange={setSelectedSchema}
          search={search}
          onSearchChange={setSearch}
          selectedTypes={selectedTypes}
          onTypesChange={setSelectedTypes}
          onExportPNG={exportToPNG}
          onExportSVG={exportToSVG}
          onZoomIn={() => zoomIn()}
          onZoomOut={() => zoomOut()}
          onFitView={() => fitView({ padding: 0.1 })}
          nodeCount={nodes.length}
          edgeCount={edges.length}
        />
      </ReactFlow>
    </div>
  )
}

export function SchemaGraph() {
  return (
    <ReactFlowProvider>
      <SchemaGraphInner />
    </ReactFlowProvider>
  )
}
