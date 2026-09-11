'use client'

import '@xyflow/react/dist/style.css'

import { Background, Controls, ReactFlow, type Node, type NodeProps } from '@xyflow/react'
import { Database, ExternalLink, FileText, Globe, Zap } from 'lucide-react'
import { useMemo } from 'react'

import type { BlockArchitecture } from '@/lib/block-architecture'

type Resource = BlockArchitecture['resources'][number]
type ResourceNode = Node<{ resources: Resource[] }, 'resource'>
type SectionNode = Node<{ label: string }, 'section'>

const resourceLabels = {
  page: 'Page',
  'api-route': 'API route',
  table: 'Table',
  'edge-function': 'Edge Function',
}

const resourceGroupLabels = {
  page: 'Pages',
  'api-route': 'API routes',
  table: 'Tables',
  'edge-function': 'Edge Functions',
}

const resourceIcons = {
  page: FileText,
  'api-route': Globe,
  table: Database,
  'edge-function': Zap,
}

const sections: { label: string; kinds: Resource['kind'][] }[] = [
  { label: 'Application', kinds: ['page', 'api-route'] },
  { label: 'Supabase', kinds: ['table', 'edge-function'] },
]

function resourceName(resource: Resource) {
  return resource.kind === 'table' && resource.schema
    ? `${resource.schema}.${resource.name}`
    : resource.name
}

function ResourceDetails({ resource, compact = false }: { resource: Resource; compact?: boolean }) {
  return (
    <>
      <div
        className={
          compact
            ? 'truncate text-xs font-medium text-foreground'
            : 'break-words text-sm font-medium text-foreground'
        }
        title={compact ? resourceName(resource) : undefined}
      >
        {resourceName(resource)}
      </div>
      {resource.route && resource.route !== resource.name && (
        <div
          className={`mt-1 font-mono text-[11px] text-foreground-lighter ${compact ? 'truncate' : 'break-all'}`}
          title={compact ? resource.route : undefined}
        >
          {resource.route}
        </div>
      )}
    </>
  )
}

function ResourceCard({ resource }: { resource: Resource }) {
  const Icon = resourceIcons[resource.kind]
  return (
    <div className="h-full rounded-lg border bg-background p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-foreground-lighter">
        <Icon size={14} className={resource.kind === 'edge-function' ? 'text-brand' : ''} />
        <span>{resourceLabels[resource.kind]}</span>
      </div>
      <div className="mt-2">
        <ResourceDetails resource={resource} />
      </div>
    </div>
  )
}

function ArchitectureCard({ data }: NodeProps<ResourceNode>) {
  const first = data.resources[0]
  const Icon = resourceIcons[first.kind]
  return (
    <div className="w-60 rounded-lg border bg-background p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs text-foreground-lighter">
        <Icon size={14} className={first.kind === 'edge-function' ? 'text-brand' : ''} />
        <span>{resourceGroupLabels[first.kind]}</span>
        <span className="ml-auto">{data.resources.length}</span>
      </div>
      <ul className="nowheel mt-3 max-h-72 space-y-3 overflow-y-auto">
        {data.resources.map((resource) => (
          <li key={resource.id}>
            <ResourceDetails resource={resource} compact />
          </li>
        ))}
      </ul>
    </div>
  )
}

function ArchitectureSection({ data }: NodeProps<SectionNode>) {
  return <div className="text-xs font-medium text-foreground-lighter">{data.label}</div>
}

const nodeTypes = { resource: ArchitectureCard, section: ArchitectureSection }

export function BlockArchitectureDiagram({ architecture }: { architecture: BlockArchitecture }) {
  const nodes = useMemo(() => {
    const nodes: (ResourceNode | SectionNode)[] = []
    let x = 0
    for (const section of sections) {
      const groups = section.kinds
        .map((kind) => architecture.resources.filter((resource) => resource.kind === kind))
        .filter((resources) => resources.length > 0)
      if (!groups.length) continue
      nodes.push({
        id: `section:${section.label}`,
        type: 'section',
        position: { x, y: -36 },
        data: { label: section.label },
        selectable: false,
      })
      let y = 0
      for (const resources of groups) {
        nodes.push({
          id: resources[0].kind,
          type: 'resource',
          position: { x, y },
          data: { resources },
          ariaLabel: `${resourceGroupLabels[resources[0].kind]}: ${resources.map(resourceName).join(', ')}`,
        })
        const contentHeight = resources.reduce(
          (height, resource) =>
            height + (resource.route && resource.route !== resource.name ? 52 : 32),
          0
        )
        y += 88 + Math.min(contentHeight, 288)
      }
      x += 360
    }
    return nodes
  }, [architecture.resources])
  const resourceCount = architecture.resources.length

  return (
    <div
      className="flex h-full flex-col bg-surface-100"
      role="region"
      aria-label={`${architecture.title} resources`}
    >
      {resourceCount === 0 ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-6 text-center text-sm text-foreground-lighter">
          No tables, Edge Functions, API routes, or pages detected.
        </div>
      ) : (
        <>
          <div className="hidden min-h-0 flex-1 md:block">
            <ReactFlow
              nodes={nodes}
              edges={[]}
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
            className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 md:sr-only"
            aria-label="Resource details"
          >
            {sections.map((section) => {
              const resources = architecture.resources.filter((resource) =>
                section.kinds.includes(resource.kind)
              )
              if (!resources.length) return null
              return (
                <section key={section.label} aria-label={section.label}>
                  <h3 className="mb-3 text-xs font-medium text-foreground-lighter">
                    {section.label}
                  </h3>
                  <ul className="space-y-3">
                    {resources.map((resource) => (
                      <li key={resource.id}>
                        <ResourceCard resource={resource} />
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        </>
      )}
      <div className="space-y-2 border-t px-4 py-3 text-xs text-foreground-lighter">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span>
            {resourceCount} {resourceCount === 1 ? 'resource' : 'resources'} detected
          </span>
          {architecture.source && (
            <a
              href={architecture.source.url}
              target="_blank"
              rel="noreferrer"
              title={`Source revision: ${architecture.source.revision}`}
              className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Source at {architecture.source.revision.slice(0, 12)}
              <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}
        </div>
        {architecture.diagnostics.length > 0 && (
          <p>Analysis is incomplete. Additional resources may be present.</p>
        )}
      </div>
    </div>
  )
}
