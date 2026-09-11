import path from 'node:path'

import { getBlockArchitecture, type BlockArchitecture } from '../lib/block-architecture'
import { getInstallCommands } from '../lib/install-command'
import { generateRegistryTree, type RegistryNode } from '../lib/process-registry'
import { resolveRegistryItem } from '../lib/registry-resolution'
import { registry } from '../registry'
import { toAgentHref } from './library-documents'

export type MarkdownOptions = {
  registryDirectory?: string
  documentSlugs?: ReadonlySet<string>
  documentSlug?: string
}

type HandlerContext = {
  props: Record<string, unknown>
  children: string
  options: MarkdownOptions
}

type ComponentHandler = (ctx: HandlerContext) => string

const omit: ComponentHandler = () => ''
const unwrap: ComponentHandler = ({ children }) => children

function requiredName(props: Record<string, unknown>, field: string): string {
  const name = props[field]
  if (typeof name !== 'string' || !name) {
    throw new Error(`Registry component requires a ${field}`)
  }
  return name
}

function BlockItem({ props }: HandlerContext): string {
  const name = requiredName(props, 'name')
  resolveRegistryItem(registry, name)
  const framework = props.framework ?? 'react'
  if (framework !== 'react' && framework !== 'vue') {
    throw new Error(`Unsupported install framework for ${name}: ${String(framework)}`)
  }
  const command = getInstallCommands(name, { framework, production: true }).npm
  return ['Install this block:', '', '```bash', command, '```'].join('\n')
}

function RegistryBlock({ props, options }: HandlerContext): string {
  const itemName = requiredName(props, 'itemName')
  const definition = resolveRegistryItem(registry, itemName)
  const registryPath = path.join(
    options.registryDirectory ?? path.join(process.cwd(), 'public', 'r'),
    `${itemName}.json`
  )
  let tree: RegistryNode[]
  try {
    tree = generateRegistryTree(registryPath)
  } catch (error) {
    throw new Error(`Cannot export registry files for ${itemName}: ${String(error)}`, {
      cause: error,
    })
  }

  const sources = [itemName, ...definition.firstPartyDependencies].map(
    (name) => `Full source: https://supabase.com/library/r/${name}.json`
  )
  const scope = definition.firstPartyDependencies.length
    ? `Includes first-party dependencies: ${definition.firstPartyDependencies.join(', ')}.`
    : ''
  const external = definition.externalRegistryDependencies.length
    ? `External registry dependencies: ${definition.externalRegistryDependencies.join(', ')}.`
    : ''

  return [scope, formatTree(tree), external, sources.join('\n')].filter(Boolean).join('\n\n')
}

function formatArchitecture(architecture: BlockArchitecture): string {
  const sections = ["## What's added"]
  const labels = {
    table: 'Tables',
    'edge-function': 'Edge Functions',
    'api-route': 'API routes',
    page: 'Pages',
  } as const
  for (const [kind, label] of Object.entries(labels)) {
    const resources = architecture.resources.filter((resource) => resource.kind === kind)
    if (!resources.length) continue
    sections.push(`### ${label}`)
    sections.push(
      resources
        .map((resource) => {
          const name = resource.schema ? `${resource.schema}.${resource.name}` : resource.name
          const route =
            resource.route && resource.route !== resource.name ? ` — \`${resource.route}\`` : ''
          return `- **${name}**${route}`
        })
        .join('\n')
    )
  }
  if (!architecture.resources.length) {
    sections.push(
      'No tables, Edge Functions, API routes, or pages were detected in the supplied files.'
    )
  }
  if (architecture.diagnostics.length) {
    sections.push(
      'Some resources could not be determined from the supplied files. Follow the complete setup guide for details.'
    )
  }
  if (architecture.source) {
    sections.push(
      `Template source: [${architecture.source.revision.slice(0, 7)}](${architecture.source.url}).`
    )
  }
  return sections.join('\n\n')
}

function BlockOverview({ props, children, options }: HandlerContext): string {
  const name = requiredName(props, 'name')
  const architecture = formatArchitecture(getBlockArchitecture(name))
  const files =
    props.showFiles === true || props.showFiles === 'true'
      ? ['## Files', RegistryBlock({ props: { itemName: name }, children: '', options })].join(
          '\n\n'
        )
      : ''
  return [children, architecture, files].filter(Boolean).join('\n\n')
}

function formatTree(nodes: RegistryNode[], indent = 0): string {
  return nodes
    .map((node) => {
      const prefix = `${'  '.repeat(indent)}- \`${node.name}${node.type === 'directory' ? '/' : ''}\``
      const children = node.children?.length ? `\n${formatTree(node.children, indent + 1)}` : ''
      return `${prefix}${children}`
    })
    .join('\n')
}

function Callout({ props, children }: HandlerContext): string {
  const type = String(props.type ?? 'note')
  const label = type.charAt(0).toUpperCase() + type.slice(1)
  return `${label}: ${children}`.trim()
}

function AccordionTrigger({ children }: HandlerContext): string {
  const title = children.trim()
  return title ? `**${title}**` : ''
}

function LinkedCard({ props, children, options }: HandlerContext): string {
  const href = toAgentHref(String(props.href ?? ''), options.documentSlugs, options.documentSlug)
  const label = children.replace(/\s+/g, ' ').trim()
  return href ? `- [${label || href}](${href})` : label
}

function ComponentPreview({ props }: HandlerContext): string {
  const description = String(props.description ?? '').trim()
  return description
}

function TanStackBeta(): string {
  return 'Note: TanStack Start support is in beta. APIs may change.'
}

function TanstackDBGenerator(): string {
  return [
    'This block is generated from your project schema.',
    'Open the HTML page to log in and generate an install command:',
    'https://supabase.com/library/docs/nextjs/tanstack-db',
  ].join('\n')
}

function Anchor({ props, children, options }: HandlerContext): string {
  const href = toAgentHref(String(props.href ?? ''), options.documentSlugs, options.documentSlug)
  return href ? `[${children}](${href})` : children
}

export const markdownSchema: Record<string, ComponentHandler> = {
  BlockItem,
  BlockOverview,
  RegistryBlock,
  Callout,
  Accordion: unwrap,
  AccordionItem: unwrap,
  AccordionTrigger,
  AccordionContent: unwrap,
  Card: unwrap,
  LinkedCard,
  FrameworkQuickstart: unwrap,
  FrameworkQuickstartTab: unwrap,
  QuickstartStep: unwrap,
  ComponentPreview,
  CatalogPreview: omit,
  BlockPreview: omit,
  DualRealtimeChat: omit,
  DualRealtimeFlow: omit,
  DualRealtimeMonaco: omit,
  RealtimeMonaco: omit,
  TanStackBeta,
  TanstackDBGenerator,
  CopyButton: omit,
  svg: omit,
  path: omit,
  title: omit,
  a: Anchor,
}
