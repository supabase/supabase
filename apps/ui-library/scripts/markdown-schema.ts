import path from 'node:path'

import { getInstallCommands } from '../lib/install-command'
import { generateRegistryTree, type RegistryNode } from '../lib/process-registry'

type HandlerContext = {
  props: Record<string, unknown>
  children: string
}

type ComponentHandler = (ctx: HandlerContext) => string

const omit: ComponentHandler = () => ''
const unwrap: ComponentHandler = ({ children }) => children

function toAgentHref(href: string): string {
  if (!href) return href
  if (href.startsWith('/library/docs/')) {
    const [pathname, hash] = href.split('#')
    const withMd = pathname.endsWith('.md') ? pathname : `${pathname}.md`
    return `https://supabase.com${withMd}${hash ? `#${hash}` : ''}`
  }
  if (href.startsWith('/') && !href.startsWith('//')) {
    return `https://supabase.com${href}`
  }
  return href
}

function BlockItem({ props }: HandlerContext): string {
  const name = String(props.name ?? '')
  if (!name) return ''
  const command = getInstallCommands(name, { production: true }).npm
  return ['Install this block:', '', '```bash', command, '```'].join('\n')
}

function RegistryBlock({ props }: HandlerContext): string {
  const itemName = String(props.itemName ?? '')
  if (!itemName) return ''

  const registryPath = path.join(process.cwd(), 'public', 'r', `${itemName}.json`)
  let listing = ''
  try {
    const tree = generateRegistryTree(registryPath)
    listing = formatTree(tree)
  } catch {
    listing = ''
  }

  const registryUrl = `https://supabase.com/library/r/${itemName}.json`
  const parts = [listing, listing ? '' : null, `Full source: ${registryUrl}`].filter(
    (part) => part !== null
  )

  return parts.join('\n').trim()
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

function LinkedCard({ props, children }: HandlerContext): string {
  const href = toAgentHref(String(props.href ?? ''))
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

function Anchor({ props, children }: HandlerContext): string {
  const href = toAgentHref(String(props.href ?? ''))
  return href ? `[${children}](${href})` : children
}

export const markdownSchema: Record<string, ComponentHandler> = {
  BlockItem,
  RegistryBlock,
  Callout,
  Accordion: unwrap,
  AccordionItem: unwrap,
  AccordionTrigger,
  AccordionContent: unwrap,
  Card: unwrap,
  LinkedCard,
  ComponentPreview,
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
