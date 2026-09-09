'use client'

import '@xyflow/react/dist/style.css'

import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Node,
  type NodeProps,
} from '@xyflow/react'
import {
  Boxes,
  Code,
  Database,
  FileText,
  Folder,
  Globe,
  Layers,
  Server,
  ShieldCheck,
  Workflow,
  Zap,
} from 'lucide-react'
import { useMemo } from 'react'

import type { ArchitectureResource, BlockArchitecture } from '@/lib/block-architecture'

type ResourceNode = Node<{ resources: ArchitectureResource[] }, 'resource'>
type SectionNode = Node<{ label: string }, 'section'>

const resourceLabels = {
  capability: 'Capability',
  page: 'Page',
  route: 'Route',
  layout: 'Layout',
  middleware: 'Middleware',
  component: 'Component',
  hook: 'Hook',
  client: 'Client',
  utility: 'Utility',
  'edge-function': 'Edge Function',
  migration: 'Migration',
  table: 'Database table',
  bucket: 'Storage bucket',
  service: 'Service',
  config: 'Configuration',
  file: 'File',
}

const resourceIcons = {
  capability: Workflow,
  page: FileText,
  route: Globe,
  layout: Layers,
  middleware: Workflow,
  component: Boxes,
  hook: Code,
  client: Server,
  utility: Code,
  'edge-function': Zap,
  migration: Database,
  table: Database,
  bucket: Folder,
  service: ShieldCheck,
  config: Code,
  file: FileText,
}

function ResourceCard({ resource }: { resource: ArchitectureResource }) {
  const Icon = resourceIcons[resource.kind]
  return (
    <div className="h-full rounded-lg border bg-background p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-foreground-lighter">
        <Icon size={14} className={resource.kind === 'edge-function' ? 'text-brand' : ''} />
        <span>{resourceLabels[resource.kind]}</span>
        {resource.status === 'existing' && <span className="ml-auto text-[10px]">Existing</span>}
      </div>
      <div className="mt-2 break-words text-sm font-medium text-foreground">{resource.label}</div>
      {resource.description && (
        <div className="mt-1 break-words text-xs leading-5 text-foreground-lighter">
          {resource.description}
        </div>
      )}
      {resource.route && (
        <div className="mt-2 font-mono text-[11px] text-foreground-lighter">{resource.route}</div>
      )}
    </div>
  )
}

function ArchitectureCard({ data }: NodeProps<ResourceNode>) {
  const first = data.resources[0]
  const Icon = resourceIcons[first.kind]
  return (
    <div className="w-60 rounded-lg border bg-background p-4 shadow-sm">
      <Handle type="target" position={Position.Left} className="border-strong! bg-surface-300!" />
      <div className="flex items-center gap-2 text-xs text-foreground-lighter">
        <Icon size={14} className={first.kind === 'edge-function' ? 'text-brand' : ''} />
        <span>{resourceLabels[first.kind]}</span>
        <span className="ml-auto">{data.resources.length}</span>
      </div>
      <div className="mt-3 space-y-1.5">
        {data.resources.slice(0, 8).map((resource) => (
          <div
            key={resource.id}
            className="truncate text-xs font-medium text-foreground"
            title={resource.description}
          >
            {resource.label}
          </div>
        ))}
        {data.resources.length > 8 && (
          <div className="text-xs text-foreground-lighter">+{data.resources.length - 8} more</div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="border-strong! bg-surface-300!" />
    </div>
  )
}

function ArchitectureSection({ data }: NodeProps<SectionNode>) {
  return <div className="text-xs font-medium text-foreground-lighter">{data.label}</div>
}

const nodeTypes = { resource: ArchitectureCard, section: ArchitectureSection }

function getSection(resource: ArchitectureResource) {
  if (resource.status === 'existing') return 'Existing resources'
  if (['page', 'layout', 'component'].includes(resource.kind)) return 'Application'
  if (['route', 'middleware', 'edge-function'].includes(resource.kind)) return 'Server'
  if (['table', 'bucket', 'migration'].includes(resource.kind)) return 'Data'
  return 'Capabilities'
}

export function BlockArchitectureDiagram({ architecture }: { architecture: BlockArchitecture }) {
  const { nodes, edges } = useMemo(() => {
    const groups = new Map<string, ArchitectureResource[]>()
    const resourceGroups = new Map<string, string>()
    for (const resource of architecture.resources) {
      const id = `${resource.status}:${resource.kind}`
      groups.set(id, [...(groups.get(id) ?? []), resource])
      resourceGroups.set(resource.id, id)
    }
    const nodes: (ResourceNode | SectionNode)[] = []
    let x = 0
    for (const section of ['Application', 'Server', 'Data', 'Existing resources', 'Capabilities']) {
      const sections = [...groups].filter(([, resources]) => getSection(resources[0]) === section)
      if (!sections.length) continue
      nodes.push({
        id: `section:${section}`,
        type: 'section',
        position: { x, y: -36 },
        data: { label: section },
        selectable: false,
      })
      let y = 0
      for (const [id, resources] of sections) {
        nodes.push({
          id,
          type: 'resource',
          position: { x, y },
          data: { resources },
          ariaLabel: resources.map((resource) => resource.label).join(', '),
        })
        y += 88 + Math.min(resources.length, 9) * 24
      }
      x += 360
    }
    const edges = [
      ...new Map(
        architecture.relationships.flatMap((relationship) => {
          const source = resourceGroups.get(relationship.source)
          const target = resourceGroups.get(relationship.target)
          if (!source || !target || source === target) return []
          const id = `${source}:${target}`
          return [
            [
              id,
              {
                id,
                source,
                target,
                ariaLabel: relationship.label,
                type: 'smoothstep',
                className: '[&_path]:stroke-border!',
                labelStyle: { fill: 'var(--foreground-light)', fontSize: 10 },
                labelBgStyle: { fill: 'var(--background-default)' },
              },
            ] as const,
          ]
        })
      ).values(),
    ]
    return { nodes, edges }
  }, [architecture])
  const added = architecture.resources.filter((resource) => resource.status === 'added').length

  return (
    <div
      className="flex h-full flex-col bg-surface-100"
      role="region"
      aria-label={`${architecture.title} architecture`}
    >
      <div className="hidden min-h-0 flex-1 md:block">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          edgesFocusable={false}
          fitView
          fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
          minZoom={0.15}
          maxZoom={1.5}
          className="bg-surface-100!"
        >
          <Background color="var(--border-default)" gap={20} />
          <Controls
            showInteractive={false}
            className="border! bg-background! text-foreground! shadow-none! [&_button]:border-default! [&_button]:bg-background! [&_button]:fill-current! hover:[&_button]:bg-surface-100!"
          />
        </ReactFlow>
      </div>
      <div
        className="min-h-0 flex-1 overflow-y-auto p-4 md:sr-only"
        role="list"
        aria-label="Architecture details"
      >
        {architecture.resources.map((resource) => (
          <div key={resource.id} role="listitem" className="mb-3">
            <ResourceCard resource={resource} />
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 border-t px-4 py-3 text-xs text-foreground-lighter">
        <span>
          {added} {added === 1 ? 'resource' : 'resources'} added
        </span>
        {architecture.resources.length > added && (
          <span>
            {architecture.resources.length - added} existing{' '}
            {architecture.resources.length - added === 1 ? 'resource' : 'resources'}
          </span>
        )}
      </div>
    </div>
  )
}
