'use client'

import {
  Background,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type NodeProps,
} from '@xyflow/react'

import '@xyflow/react/dist/style.css'

import { AlertTriangle, Database, Monitor, Package, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Card, CardContent, cn } from 'ui'

import type { DependencyResolution, MergeResult } from '../../lib/composition/composition'
import { buildRowLayout, type ColumnPosition } from '../../lib/composition/flow-layout'
import { getResourceIcon } from '../../lib/composition/resource-icons'
import type { CompositionResource } from '../../lib/composition/resources'
import { FRAMEWORKS, hasFrontend, type StartConfig } from '../../lib/config'
import type { Template } from '../../lib/template-catalog'

interface CompositionVisualizerProps {
  cfg: StartConfig
  templates: Template[]
  resolution: DependencyResolution
  mergeResult: MergeResult | null
  resources: CompositionResource[]
  hoveredTemplateId: string | null
  onSelectFile: (path: string) => void
}

interface CompositionFlow {
  nodes: Node[]
  edges: Edge[]
}

interface BackendNodeBounds {
  position: { x: number; y: number }
  width: number
  height: number
}

const NODE_WIDTH = 170
const NODE_GAP = 40
const NODE_ESTIMATED_HEIGHT = 44
const DATABASE_NODE_ESTIMATED_HEIGHT = 88
const VERTICAL_SIBLING_GAP = 4
const BACKEND_GROUP_ID = 'backend'
const BACKEND_GROUP_HORIZONTAL_PADDING = 28
const BACKEND_GROUP_TOP_PADDING = 44
const BACKEND_GROUP_BOTTOM_PADDING = 24
const FRONTEND_GROUP_GAP = 40
const LAYOUT = {
  topRowY: 30,
  secondRowY: 150,
  groupStartY: 280,
  groupNodeSpacing: NODE_ESTIMATED_HEIGHT + VERTICAL_SIBLING_GAP,
  columnWidth: NODE_WIDTH,
  columnGap: NODE_GAP,
}

const ROW_LAYOUT_CONFIG = {
  columnWidth: LAYOUT.columnWidth,
  columnGap: LAYOUT.columnGap,
}

const nodeTypes = {
  backendGroup: BackendGroupNode,
  database: DatabaseNode,
  feature: FeatureNode,
}

const reactFlowThemeVars = {
  color: 'hsl(var(--foreground-default))',
  background: 'hsl(var(--background-default))',
  '--xy-node-color': 'hsl(var(--foreground-default))',
  '--xy-node-background-color': 'hsl(var(--background-default))',
  '--xy-node-border': '1px solid hsl(var(--border-default))',
  '--xy-edge-stroke': 'hsl(var(--border-strong))',
  '--xy-background-color': 'hsl(var(--background-default))',
} as CSSProperties

export function CompositionVisualizer(props: CompositionVisualizerProps) {
  return (
    <ReactFlowProvider>
      <div className="h-full w-full">
        <CompositionVisualizerCanvas {...props} />
      </div>
    </ReactFlowProvider>
  )
}

function CompositionVisualizerCanvas({
  cfg,
  templates,
  resolution,
  mergeResult,
  resources,
  hoveredTemplateId,
  onSelectFile,
}: CompositionVisualizerProps) {
  const [documentTheme, setDocumentTheme] = useState<'dark' | 'light'>('dark')
  const { fitView } = useReactFlow()
  const { nodes, edges } = useMemo(() => {
    return buildCompositionFlow({
      cfg,
      templates,
      resolution,
      mergeResult,
      resources,
      hoveredTemplateId,
    })
  }, [cfg, hoveredTemplateId, mergeResult, resolution, resources, templates])

  const graphLayoutKey = useMemo(
    () => buildGraphLayoutKey({ frameworkId: cfg.framework, resolution, mergeResult, resources }),
    [cfg.framework, mergeResult, resolution, resources]
  )

  useEffect(() => {
    if (nodes.length === 0) return

    const frame = requestAnimationFrame(() => {
      void fitView({ padding: 0.15, duration: 200 })
    })

    return () => cancelAnimationFrame(frame)
  }, [fitView, graphLayoutKey, nodes.length])

  const handleNodeClick: NodeMouseHandler = (_, node) => {
    if (!node.id.startsWith('resource:')) return

    const sourceFilePath = node.data.sourceFilePath
    if (typeof sourceFilePath === 'string') onSelectFile(sourceFilePath)
  }

  useEffect(() => {
    const readTheme = () => {
      const theme = document.documentElement.getAttribute('data-theme')
      setDocumentTheme(theme?.includes('dark') ? 'dark' : 'light')
    }

    readTheme()

    const observer = new MutationObserver(readTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class', 'style'],
    })

    return () => observer.disconnect()
  }, [])

  const flowTheme = documentTheme

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
            <Package className="h-8 w-8 text-foreground-light" />
          </div>
          <h3 className="text-lg font-medium">No project graph yet</h3>
          <p className="mt-1 text-sm text-foreground-light">
            Add templates from the market to visualize the generated project.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={handleNodeClick}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.1}
      maxZoom={1.5}
      nodesConnectable={false}
      nodesDraggable={false}
      elementsSelectable={false}
      proOptions={{ hideAttribution: true }}
      colorMode={flowTheme}
      className="h-full w-full bg-card/30"
      style={reactFlowThemeVars}
      data-theme={flowTheme}
    >
      <Background gap={20} size={1} className="opacity-50" />
    </ReactFlow>
  )
}

export function buildCompositionFlow({
  cfg,
  templates,
  resolution,
  mergeResult,
  resources,
  hoveredTemplateId,
}: {
  cfg: StartConfig
  templates: Template[]
  resolution: DependencyResolution
  mergeResult: MergeResult | null
  resources: CompositionResource[]
  hoveredTemplateId: string | null
}): CompositionFlow {
  const showFrontend = hasFrontend(cfg)

  if (
    !showFrontend &&
    !mergeResult &&
    resources.length === 0 &&
    resolution.missingDeps.length === 0
  ) {
    return { nodes: [], edges: [] }
  }

  const resourceIds = new Set(resources.map((resource) => resource.id))
  const topLevelResources = getTopLevelResources(resources, resourceIds)
  const childrenByParentId = groupChildrenByParent(resources, resourceIds)

  const nodes: Node[] = []
  const edges: Edge[] = []
  const backendNodeBounds: BackendNodeBounds[] = []
  const topLevelIds = topLevelResources.map((resource) => resource.id)
  const topLevelLayout = buildRowLayout(topLevelIds, 0, ROW_LAYOUT_CONFIG)
  const highlightedTemplateIds = hoveredTemplateId
    ? getHighlightedTemplateIds(hoveredTemplateId, templates)
    : null

  const databasePosition = { x: 0, y: LAYOUT.topRowY }
  nodes.push({
    id: 'database',
    type: 'database',
    position: databasePosition,
    zIndex: 1,
    data: {
      label: 'Database',
      sublabel: 'Postgres',
    },
  })
  backendNodeBounds.push({
    position: databasePosition,
    width: NODE_WIDTH,
    height: DATABASE_NODE_ESTIMATED_HEIGHT,
  })

  for (const resource of topLevelResources) {
    const nodeId = `resource:${resource.id}`
    const layout = topLevelLayout.get(resource.id) ?? { x: 0 }
    const Icon = getResourceIcon(resource)
    const position = { x: layout.x, y: LAYOUT.secondRowY }

    nodes.push({
      id: nodeId,
      type: 'feature',
      position,
      zIndex: 1,
      data: {
        label: resource.label,
        sublabel: getResourceTypeLabel(resource),
        icon: Icon,
        sourceFilePath: resource.sourceFilePath,
        templateIds: resource.sourceTemplateIds,
      },
    })
    backendNodeBounds.push({ position, width: NODE_WIDTH, height: NODE_ESTIMATED_HEIGHT })

    if (resource.connectsToDatabase) {
      edges.push({
        id: `database-${nodeId}`,
        source: 'database',
        target: nodeId,
        sourceHandle: 'bottom',
        targetHandle: 'target-top',
        animated: true,
        style: { stroke: '#555', strokeWidth: 1.5 },
      })
    }
  }

  for (const topLevelResource of topLevelResources) {
    const childResources = childrenByParentId.get(topLevelResource.id) ?? []
    const layout = topLevelLayout.get(topLevelResource.id) ?? { x: 0 }

    childResources.forEach((resource, index) => {
      const nodeId = `resource:${resource.id}`
      const Icon = getResourceIcon(resource)
      const position = {
        x: layout.x,
        y: LAYOUT.groupStartY + index * LAYOUT.groupNodeSpacing,
      }

      nodes.push({
        id: nodeId,
        type: 'feature',
        position,
        zIndex: 1,
        data: {
          label: resource.label,
          sublabel: getResourceTypeLabel(resource),
          icon: Icon,
          sourceFilePath: resource.sourceFilePath,
          templateIds: resource.sourceTemplateIds,
        },
      })
      backendNodeBounds.push({ position, width: NODE_WIDTH, height: NODE_ESTIMATED_HEIGHT })
      edges.push({
        id: `resource:${topLevelResource.id}-${nodeId}`,
        source: `resource:${topLevelResource.id}`,
        sourceHandle: 'source-bottom',
        target: nodeId,
        targetHandle: 'target-top',
        animated: true,
        style: { stroke: '#555', strokeWidth: 1.5 },
      })
    })
  }

  for (const [index, warning] of [
    ...(mergeResult?.warnings ?? []),
    ...resolution.missingDeps,
  ].entries()) {
    nodes.push({
      id: `warning:${index}`,
      type: 'feature',
      position: {
        x: getWarningColumnX(topLevelLayout) + LAYOUT.columnWidth + LAYOUT.columnGap,
        y: LAYOUT.groupStartY + index * LAYOUT.groupNodeSpacing,
      },
      zIndex: 1,
      data: {
        label: warning,
        sublabel: 'Warning',
        icon: AlertTriangle,
        templateIds: [],
        isWarning: true,
      },
    })
  }

  if (showFrontend) {
    const backendGroup = getBackendGroupBounds(backendNodeBounds)
    const frontendPosition = {
      x: backendGroup.x + backendGroup.width / 2 - NODE_WIDTH / 2,
      y: backendGroup.y - NODE_ESTIMATED_HEIGHT - FRONTEND_GROUP_GAP,
    }

    nodes.unshift({
      id: BACKEND_GROUP_ID,
      type: 'backendGroup',
      position: { x: backendGroup.x, y: backendGroup.y },
      zIndex: 0,
      data: {
        label: 'Back-end',
        width: backendGroup.width,
        height: backendGroup.height,
      },
    })

    nodes.push({
      id: 'frontend',
      type: 'feature',
      position: frontendPosition,
      zIndex: 2,
      data: {
        label: FRAMEWORKS[cfg.framework].label,
        sublabel: 'Front-end',
        icon: Monitor,
        templateIds: [],
        isFrontend: true,
      },
    })

    edges.push({
      id: 'frontend-backend',
      source: 'frontend',
      target: BACKEND_GROUP_ID,
      sourceHandle: 'source-bottom',
      targetHandle: 'target-top',
      animated: true,
      style: { stroke: '#555', strokeWidth: 1.5 },
    })
  }

  if (highlightedTemplateIds) {
    for (const node of nodes) {
      const templateIds = (node.data as { templateIds?: string[] }).templateIds ?? []
      const isRelated =
        node.id === BACKEND_GROUP_ID ||
        node.id === 'database' ||
        node.id === 'frontend' ||
        templateIds.some((templateId) => highlightedTemplateIds.has(templateId))
      if (!isRelated) node.style = { ...node.style, opacity: 0.25 }
    }
  }

  return { nodes, edges }
}

function BackendGroupNode({ data }: NodeProps) {
  const width = Number(data.width)
  const height = Number(data.height)

  return (
    <div
      className="pointer-events-none relative rounded-md border border-default/50 bg-transparent"
      style={{ width, height }}
    >
      <Handle type="target" position={Position.Top} id="target-top" className="opacity-0" />
      <span className="absolute left-3 top-2 font-mono text-[10px] font-medium uppercase text-foreground-lighter">
        {String(data.label)}
      </span>
    </div>
  )
}

function NodeIcon({ icon: Icon, accent }: { icon: LucideIcon; accent?: 'frontend' }) {
  return (
    <div
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-lg bg-background',
        accent === 'frontend' && 'bg-brand-200'
      )}
    >
      <Icon
        className={cn('size-3 text-foreground-lighter', accent === 'frontend' && 'text-brand-600')}
        strokeWidth={1.5}
      />
    </div>
  )
}

function DatabaseNode({ data }: NodeProps) {
  return (
    <div className="relative" style={{ width: NODE_WIDTH }}>
      <Handle type="target" position={Position.Left} id="target-left" className="opacity-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0" />
      <Card>
        <CardContent className="flex flex-col items-center gap-2 border-none px-0.5 py-2 text-center">
          <NodeIcon icon={Database} />
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-xs font-medium">{String(data.label)}</span>
            {data.sublabel ? (
              <span className="truncate text-xs text-foreground-light">
                {String(data.sublabel)}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function FeatureNode({ data }: NodeProps) {
  const Icon = data.icon as LucideIcon
  const isWarning = Boolean(data.isWarning)
  const isFrontend = Boolean(data.isFrontend)

  return (
    <div className="relative" style={{ width: NODE_WIDTH }}>
      <Handle type="target" position={Position.Top} id="target-top" className="opacity-0" />
      <Handle type="source" position={Position.Bottom} id="source-bottom" className="opacity-0" />
      <Handle type="source" position={Position.Right} id="source-right" className="opacity-0" />
      <Card
        className={cn(
          isWarning && 'border-warning/40 bg-warning/10',
          isFrontend && 'border-brand/40 bg-brand/10'
        )}
      >
        <CardContent className="flex flex-row items-center gap-2 border-none p-0.5 text-left">
          <NodeIcon icon={Icon} accent={isFrontend ? 'frontend' : undefined} />
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-xs font-medium">{String(data.label)}</span>
            {data.sublabel ? (
              <span className="truncate text-xs text-foreground-light">
                {String(data.sublabel)}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Top-level resources are those without a `parentResourceId`, or whose parent
 * isn't in the current resource set (orphaned). Sort by extractor-declared
 * `displayOrder` (lower first), then alphabetically by label.
 */
function getTopLevelResources(resources: CompositionResource[], resourceIds: Set<string>) {
  return resources
    .filter((resource) => !resource.parentResourceId || !resourceIds.has(resource.parentResourceId))
    .sort((a, b) => {
      const aOrder = a.displayOrder ?? Number.POSITIVE_INFINITY
      const bOrder = b.displayOrder ?? Number.POSITIVE_INFINITY
      if (aOrder !== bOrder) return aOrder - bOrder
      return a.label.localeCompare(b.label)
    })
}

function groupChildrenByParent(resources: CompositionResource[], resourceIds: Set<string>) {
  const grouped = new Map<string, CompositionResource[]>()

  for (const resource of resources) {
    const parentId = resource.parentResourceId
    if (!parentId || !resourceIds.has(parentId)) continue
    const siblings = grouped.get(parentId) ?? []
    siblings.push(resource)
    grouped.set(parentId, siblings)
  }

  for (const siblings of grouped.values()) {
    siblings.sort((a, b) => a.label.localeCompare(b.label))
  }

  return grouped
}

function getBackendGroupBounds(nodes: BackendNodeBounds[]) {
  const left = Math.min(...nodes.map((node) => node.position.x))
  const right = Math.max(...nodes.map((node) => node.position.x + node.width))
  const top = Math.min(...nodes.map((node) => node.position.y))
  const bottom = Math.max(...nodes.map((node) => node.position.y + node.height))
  const x = left - BACKEND_GROUP_HORIZONTAL_PADDING
  const y = top - BACKEND_GROUP_TOP_PADDING

  return {
    x,
    y,
    width: right - left + BACKEND_GROUP_HORIZONTAL_PADDING * 2,
    height: bottom - top + BACKEND_GROUP_TOP_PADDING + BACKEND_GROUP_BOTTOM_PADDING,
  }
}

function getWarningColumnX(layout: Map<string, ColumnPosition>) {
  if (layout.size === 0) return LAYOUT.columnWidth + LAYOUT.columnGap

  return Math.max(...Array.from(layout.values()).map((item) => item.x))
}

function getResourceTypeLabel(resource: CompositionResource) {
  if (resource.kind === 'edge-function') return 'Edge Function'
  if (resource.kind === 'config') return 'Config'
  if (resource.kind === 'schema') return 'Schema'
  if (resource.kind === 'table') return 'Table'
  if (resource.kind === 'bucket') return 'Bucket'
  return 'Resource'
}

function getHighlightedTemplateIds(hoveredTemplateId: string, templates: Template[]) {
  const ids = new Set<string>([hoveredTemplateId])
  const template = templates.find((candidate) => candidate.id === hoveredTemplateId)
  template?.dependencies?.required?.forEach((dependencyId) => ids.add(dependencyId))
  return ids
}

/** Stable key for graph structure — excludes hover so fitView does not run on highlight. */
export function buildGraphLayoutKey({
  frameworkId,
  resolution,
  mergeResult,
  resources,
}: {
  frameworkId?: string
  resolution: DependencyResolution
  mergeResult: MergeResult | null
  resources: CompositionResource[]
}) {
  const templatePart = resolution.resolved
    .map((template) => template.id)
    .sort()
    .join(',')
  const resourcePart = resources
    .map((resource) => `${resource.id}:${resource.parentResourceId ?? ''}`)
    .sort()
    .join(',')
  const warningPart = [...(mergeResult?.warnings ?? []), ...resolution.missingDeps].join('|')

  return `${frameworkId ?? ''}|${templatePart}|${resourcePart}|${warningPart}`
}
