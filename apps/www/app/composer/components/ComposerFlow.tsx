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
import { AlertTriangle, Database, Package, type LucideIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Card, CardContent, cn } from 'ui'

import type { DependencyResolution, MergeResult } from '../lib/composer'
import { buildRowLayout, type ColumnPosition } from '../lib/flow-layout'
import { getResourceIcon } from '../lib/resource-icons'
import type { ComposerResource } from '../lib/resources'
import type { Template } from '../lib/templates'

interface ComposerFlowProps {
  templates: Template[]
  resolution: DependencyResolution
  mergeResult: MergeResult | null
  resources: ComposerResource[]
  hoveredTemplateId: string | null
  onSelectFile: (path: string) => void
}

const NODE_WIDTH = 170
const NODE_GAP = 40
const NODE_ESTIMATED_HEIGHT = 44
const VERTICAL_SIBLING_GAP = 4
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

export function ComposerFlow(props: ComposerFlowProps) {
  return (
    <ReactFlowProvider>
      <ComposerFlowCanvas {...props} />
    </ReactFlowProvider>
  )
}

function ComposerFlowCanvas({
  templates,
  resolution,
  mergeResult,
  resources,
  hoveredTemplateId,
  onSelectFile,
}: ComposerFlowProps) {
  const { resolvedTheme } = useTheme()
  const [documentTheme, setDocumentTheme] = useState<'dark' | 'light'>('dark')
  const { fitView } = useReactFlow()
  const { nodes, edges } = useMemo(() => {
    return buildPrototypeFlow({
      templates,
      resolution,
      mergeResult,
      resources,
      hoveredTemplateId,
    })
  }, [hoveredTemplateId, mergeResult, resolution, resources, templates])

  const graphLayoutKey = useMemo(
    () => buildGraphLayoutKey({ resolution, mergeResult, resources }),
    [mergeResult, resolution, resources]
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

  const flowTheme = resolvedTheme?.includes('dark') ? 'dark' : documentTheme

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-100">
            <Package className="h-8 w-8 text-foreground-muted" />
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
      className="bg-card/30"
      style={reactFlowThemeVars}
      data-theme={flowTheme}
    >
      <Background gap={20} size={1} className="opacity-50" />
    </ReactFlow>
  )
}

function buildPrototypeFlow({
  templates,
  resolution,
  mergeResult,
  resources,
  hoveredTemplateId,
}: {
  templates: Template[]
  resolution: DependencyResolution
  mergeResult: MergeResult | null
  resources: ComposerResource[]
  hoveredTemplateId: string | null
}) {
  if (!mergeResult && resources.length === 0 && resolution.missingDeps.length === 0) {
    return { nodes: [], edges: [] }
  }

  const resourceIds = new Set(resources.map((resource) => resource.id))
  const topLevelResources = getTopLevelResources(resources, resourceIds)
  const childrenByParentId = groupChildrenByParent(resources, resourceIds)

  const nodes: Node[] = [
    {
      id: 'database',
      type: 'database',
      position: { x: 0, y: LAYOUT.topRowY },
      data: {
        label: 'Database',
        sublabel: 'Postgres',
      },
    },
  ]
  const edges: Edge[] = []
  const topLevelLayout = buildRowLayout(
    topLevelResources.map((resource) => resource.id),
    0,
    ROW_LAYOUT_CONFIG
  )
  const highlightedTemplateIds = hoveredTemplateId
    ? getHighlightedTemplateIds(hoveredTemplateId, templates)
    : null

  for (const resource of topLevelResources) {
    const nodeId = `resource:${resource.id}`
    const layout = topLevelLayout.get(resource.id) ?? { x: 0 }
    const Icon = getResourceIcon(resource)

    nodes.push({
      id: nodeId,
      type: 'feature',
      position: { x: layout.x, y: LAYOUT.secondRowY },
      data: {
        label: resource.label,
        sublabel: getResourceTypeLabel(resource),
        icon: Icon,
        sourceFilePath: resource.sourceFilePath,
        templateIds: resource.sourceTemplateIds,
      },
    })

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

      nodes.push({
        id: nodeId,
        type: 'feature',
        position: { x: layout.x, y: LAYOUT.groupStartY + index * LAYOUT.groupNodeSpacing },
        data: {
          label: resource.label,
          sublabel: getResourceTypeLabel(resource),
          icon: Icon,
          sourceFilePath: resource.sourceFilePath,
          templateIds: resource.sourceTemplateIds,
        },
      })
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
      data: {
        label: warning,
        sublabel: 'Warning',
        icon: AlertTriangle,
        templateIds: [],
        isWarning: true,
      },
    })
  }

  if (highlightedTemplateIds) {
    for (const node of nodes) {
      const templateIds = (node.data as { templateIds?: string[] }).templateIds ?? []
      const isRelated =
        node.id === 'database' ||
        templateIds.some((templateId) => highlightedTemplateIds.has(templateId))
      if (!isRelated) node.style = { ...node.style, opacity: 0.25 }
    }
  }

  return { nodes, edges }
}

function NodeIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background">
      <Icon className="size-3 text-foreground-lighter" strokeWidth={1.5} />
    </div>
  )
}

function DatabaseNode({ data }: NodeProps) {
  return (
    <div className="relative" style={{ width: NODE_WIDTH }}>
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

  return (
    <div className="relative" style={{ width: NODE_WIDTH }}>
      <Handle type="target" position={Position.Top} id="target-top" className="opacity-0" />
      <Handle type="source" position={Position.Bottom} id="source-bottom" className="opacity-0" />
      <Card className={cn(isWarning && 'border-warning/40 bg-warning/10')}>
        <CardContent className="flex flex-row items-center gap-2 border-none p-0.5 text-left">
          <NodeIcon icon={Icon} />
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
function getTopLevelResources(resources: ComposerResource[], resourceIds: Set<string>) {
  return resources
    .filter((resource) => !resource.parentResourceId || !resourceIds.has(resource.parentResourceId))
    .sort((a, b) => {
      const aOrder = a.displayOrder ?? Number.POSITIVE_INFINITY
      const bOrder = b.displayOrder ?? Number.POSITIVE_INFINITY
      if (aOrder !== bOrder) return aOrder - bOrder
      return a.label.localeCompare(b.label)
    })
}

function groupChildrenByParent(resources: ComposerResource[], resourceIds: Set<string>) {
  const grouped = new Map<string, ComposerResource[]>()

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

function getWarningColumnX(layout: Map<string, ColumnPosition>) {
  if (layout.size === 0) return LAYOUT.columnWidth + LAYOUT.columnGap

  return Math.max(...Array.from(layout.values()).map((item) => item.x))
}

function getResourceTypeLabel(resource: ComposerResource) {
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
  resolution,
  mergeResult,
  resources,
}: {
  resolution: DependencyResolution
  mergeResult: MergeResult | null
  resources: ComposerResource[]
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

  return `${templatePart}|${resourcePart}|${warningPart}`
}
