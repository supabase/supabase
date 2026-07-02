'use client'

import type { Content } from 'mdast'
import Image, { type StaticImageData } from 'next/image'
import { Fragment, type ReactNode } from 'react'
import { cn } from 'ui'
import { CodeBlock, isCodeBlockLang } from 'ui-patterns/CodeBlock'

import antigravityAuthenticateScreenshot from '../assets/antigravity-authenticate-screenshot.png'
import { calloutVariant, type McpInstructionContent } from '../clients.instructions.md'
import type { McpOnCopyCallback } from '../types'

/**
 * Local image assets referenced by `image` nodes, keyed by the node's `url`
 * (used as an asset id, not a real URL). Kept here so the React-free
 * instructions module stays importable by the Node markdown build, which can't
 * resolve static png imports.
 */
const INSTRUCTION_ASSETS: Record<string, StaticImageData> = {
  'antigravity-auth': antigravityAuthenticateScreenshot,
}

/**
 * Per-node-type renderers, keyed by the mdast node's `type`. The mapped type
 * narrows each renderer's `node` to that type (e.g. `link` receives a `Link`).
 * A node type with no renderer (and its subtree) is skipped. Renderers don't deal
 * with React keys - `renderList` applies those.
 */
type Renderers = {
  [K in Content['type']]?: (node: Extract<Content, { type: K }>, children: ReactNode[]) => ReactNode
}

/** Recursively renders an mdast node (see `clients.instructions.md.tsx`) as React. */
function renderNode(node: Content, renderers: Renderers): ReactNode {
  // The mapped type guarantees renderers[node.type] matches node; the index
  // can't prove it to the compiler, so widen at this single dispatch point.
  const renderer = renderers[node.type] as
    | ((node: Content, children: ReactNode[]) => ReactNode)
    | undefined
  if (!renderer) return null
  const children = 'children' in node ? renderList(node.children as Content[], renderers) : []
  return renderer(node, children)
}

/** Renders a list of sibling nodes, applying React keys so renderers don't have to. */
function renderList(nodes: Content[], renderers: Renderers): ReactNode[] {
  return nodes.map((node, i) => <Fragment key={i}>{renderNode(node, renderers)}</Fragment>)
}

/** Builds the per-node-type renderer map for rendering mdast as React. Commands
 * become copyable `CodeBlock`s, callouts colored text, and `image` nodes resolve
 * their asset id to a bundled screenshot. */
function reactRenderers(onCopy: (type?: McpOnCopyCallback) => void): Renderers {
  const renderers: Renderers = {
    text: (node) => node.value,
    inlineCode: (node) => <code>{node.value}</code>,
    strong: (_node, children) => <strong>{children}</strong>,
    emphasis: (_node, children) => <em>{children}</em>,
    link: (node, children) => (
      <a
        href={node.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-brand-link hover:underline"
      >
        {children}
      </a>
    ),
    paragraph: (_node, children) => <p className="text-xs text-foreground-light">{children}</p>,
    code: (node) => (
      <CodeBlock
        value={node.value}
        language={node.lang && isCodeBlockLang(node.lang) ? node.lang : undefined}
        focusable={false}
        // CodeBlock renders inline code without a className; force a block.
        className="block"
        onCopyCallback={() => onCopy('command')}
      />
    ),
    image: (node) => {
      const src = INSTRUCTION_ASSETS[node.url]
      return src ? (
        <Image src={src} alt={node.alt ?? ''} className="rounded border border-muted w-full" />
      ) : null
    },
    blockquote: (node) => {
      // Callouts render as colored inline text (no quote chrome). The variant
      // lives in `data`; children render inline so the color isn't overridden.
      const variant = calloutVariant(node.data)
      return (
        <p
          className={cn(
            'text-xs',
            variant === 'warning' ? 'text-warning' : 'text-foreground-light'
          )}
        >
          {renderList(node.children as Content[], {
            ...renderers,
            paragraph: (_, children) => children,
          })}
        </p>
      )
    },
  }
  return renderers
}

/** A node, or the children of a Fragment-produced `root`. */
const toNodes = (tree: McpInstructionContent): Content[] =>
  tree.type === 'root' ? (tree.children as Content[]) : [tree as Content]

interface InstructionContentProps {
  /** Instruction tree from `MCP_CLIENT_INSTRUCTIONS` (commands pre-resolved). */
  tree: McpInstructionContent
  onCopy: (type?: McpOnCopyCallback) => void
}

/**
 * Renders an instruction tree (see `clients.instructions.md.tsx`) as React, for
 * every surface that shows the live component (Studio's Connect sheet, the docs
 * website). The generated `.md` docs render the same tree via their own mdast
 * adapter, so the two stay in sync.
 */
export function InstructionContent({ tree, onCopy }: InstructionContentProps) {
  return <div className="space-y-2">{renderList(toNodes(tree), reactRenderers(onCopy))}</div>
}

/** Renders a tree's text inline, for the deep-link description label. */
export function InlineContent({ tree }: { tree: McpInstructionContent }) {
  const renderers: Renderers = {
    ...reactRenderers(() => {}),
    paragraph: (_, children) => children,
  }
  return renderList(toNodes(tree), renderers)
}
