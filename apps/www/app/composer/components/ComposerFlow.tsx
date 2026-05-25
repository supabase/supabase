'use client'

import {
  Background,
  Handle,
  Position,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeMouseHandler,
  type NodeProps,
} from '@xyflow/react'
import {
  AlertTriangle,
  Database,
  FileCode,
  HardDrive,
  Key,
  Layers,
  Package,
  Server,
  Shield,
  Table,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Card, CardContent, cn } from 'ui'

import type { DependencyResolution, MergeResult } from '../lib/composer'
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

const TOP_LEVEL_CONFIG_ORDER = ['db', 'api', 'auth', 'storage', 'edge_runtime', 'realtime'] as const

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
  const { nodes, edges } = useMemo(() => {
    return buildPrototypeFlow({
      templates,
      resolution,
      mergeResult,
      resources,
      hoveredTemplateId,
    })
  }, [hoveredTemplateId, mergeResult, resolution, resources, templates])

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

  const nodes: Node[] = [
    {
      id: 'database',
      type: 'database',
      position: { x: 0, y: LAYOUT.topRowY },
      data: {
        label: 'Database',
        sublabel: 'PostgreSQL',
        computeSize: 'Micro',
        region: 'Asia-Pacific',
      },
    },
  ]
  const edges: Edge[] = []
  const topLevelResources = getTopLevelResources(resources)
  const topLevelLayout = buildRowLayout(
    topLevelResources.map((resource) => resource.id),
    0
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

  for (const topLevelResource of topLevelResources) {
    const childResources = resources.filter((resource) => {
      return getParentResourceId(resource, resources) === topLevelResource.id
    })
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

function DatabaseNode({ data }: NodeProps) {
  return (
    <div className="relative" style={{ width: NODE_WIDTH }}>
      <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0" />
      <Card>
        <CardContent className="flex flex-col items-center gap-2 border-none px-2 py-1.5 text-center">
          <Database className="size-4 text-foreground-lighter" strokeWidth={1.5} />
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-xs font-medium">{String(data.label)}</span>
            <div className="flex flex-wrap justify-center gap-1 text-xs">
              <span className="bg-primary/20 text-primary">{String(data.computeSize)}</span>
              <span className="text-foreground-light">in</span>
              <span className="bg-primary/20 text-primary">{String(data.region)}</span>
            </div>
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
        <CardContent className="flex flex-row items-center gap-2 border-none px-2 py-1.5 text-left">
          <Icon className="size-4 shrink-0 text-foreground-lighter" strokeWidth={1.5} />
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

function buildRowLayout(nodeIds: string[], centerX: number) {
  const rowConfig = new Map<string, { x: number; width: number }>()
  if (nodeIds.length === 0) return rowConfig

  const totalWidth =
    nodeIds.length * LAYOUT.columnWidth + LAYOUT.columnGap * Math.max(0, nodeIds.length - 1)
  let cursor = centerX - totalWidth / 2

  nodeIds.forEach((nodeId) => {
    const center = cursor + LAYOUT.columnWidth / 2
    rowConfig.set(nodeId, { x: center, width: LAYOUT.columnWidth })
    cursor = center + LAYOUT.columnWidth / 2 + LAYOUT.columnGap
  })

  return rowConfig
}

function getTopLevelResources(resources: ComposerResource[]) {
  const resourceIds = new Set(resources.map((resource) => resource.id))

  return resources
    .filter((resource) => {
      return isTopLevelResource(resource) || !getParentResourceId(resource, resourceIds)
    })
    .sort(compareTopLevelResources)
}

function isTopLevelResource(resource: ComposerResource) {
  return resource.kind === 'config' || resource.kind === 'schema'
}

function getParentResourceId(
  resource: ComposerResource,
  resources: ComposerResource[] | Set<string>
) {
  const resourceIds = Array.isArray(resources)
    ? new Set(resources.map((candidate) => candidate.id))
    : resources

  let parentId: string | null = null

  if (resource.kind === 'table') {
    parentId = `schema:${resource.schema ?? 'public'}`
  } else if (resource.kind === 'bucket') {
    parentId = 'config:storage'
  } else if (resource.kind === 'edge-function') {
    parentId = 'config:edge_runtime'
  }

  return parentId && resourceIds.has(parentId) ? parentId : null
}

function compareTopLevelResources(a: ComposerResource, b: ComposerResource) {
  const aRank = getTopLevelResourceRank(a)
  const bRank = getTopLevelResourceRank(b)

  if (aRank !== bRank) return aRank - bRank

  return a.label.localeCompare(b.label)
}

function getTopLevelResourceRank(resource: ComposerResource) {
  if (resource.kind === 'config') {
    const index = TOP_LEVEL_CONFIG_ORDER.indexOf(
      resource.label as (typeof TOP_LEVEL_CONFIG_ORDER)[number]
    )

    return index === -1 ? TOP_LEVEL_CONFIG_ORDER.length : index
  }

  return TOP_LEVEL_CONFIG_ORDER.length + 1
}

function getWarningColumnX(layout: Map<string, { x: number; width: number }>) {
  if (layout.size === 0) return LAYOUT.columnWidth + LAYOUT.columnGap

  return Math.max(...Array.from(layout.values()).map((item) => item.x))
}

function getResourceIcon(resource: ComposerResource): LucideIcon {
  if (resource.kind === 'table') return Table
  if (resource.kind === 'bucket') return HardDrive
  if (resource.kind === 'edge-function') return Server
  if (resource.kind === 'schema') return Layers
  if (resource.label === 'auth') return Key
  if (resource.label === 'storage') return HardDrive
  if (resource.label === 'edge_runtime') return Server
  if (resource.label === 'realtime') return Zap
  if (resource.label === 'vault') return Shield
  return FileCode
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
