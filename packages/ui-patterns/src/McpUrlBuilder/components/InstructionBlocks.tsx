'use client'

import Image, { type StaticImageData } from 'next/image'
import { Fragment } from 'react'
import { cn } from 'ui'
import { CodeBlock } from 'ui-patterns/CodeBlock'

import antigravityAuthenticateScreenshot from '../assets/antigravity-authenticate-screenshot.png'
import type { McpBlock, McpInline } from '../clients.data'
import type { McpOnCopyCallback } from '../types'

/**
 * Local image assets referenced by `image` blocks, keyed by the block's `asset`
 * id. Kept here (not in `clients.data.ts`) so the React-free data module stays
 * importable by the Node markdown build, which can't resolve static png imports.
 */
// `.png` imports resolve to `string` under some tsconfigs and `StaticImageData`
// under others (e.g. Next's). `next/image` accepts both, so allow either.
const INSTRUCTION_ASSETS: Record<string, string | StaticImageData> = {
  'antigravity-auth': antigravityAuthenticateScreenshot,
}

/** Renders a list of inline spans (plain text, inline code, bold, links). */
export function InlineContent({ parts }: { parts: McpInline[] }) {
  return (
    <>
      {parts.map((part, i) => {
        if (typeof part === 'string') return <Fragment key={i}>{part}</Fragment>
        if ('code' in part) return <code key={i}>{part.code}</code>
        if ('strong' in part) return <strong key={i}>{part.strong}</strong>
        return (
          <a
            key={i}
            href={part.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-link hover:underline"
          >
            {part.link}
          </a>
        )
      })}
    </>
  )
}

interface InstructionBlocksProps {
  blocks: McpBlock[]
  /** Resolved MCP server URL, interpolated into command blocks. */
  url: string
  onCopy: (type?: McpOnCopyCallback) => void
}

/**
 * Renders portable instruction blocks (see `clients.data.ts`) as dashboard UI.
 * The markdown docs render the same blocks via their own mdast adapter, so the
 * two surfaces stay in sync.
 */
export function InstructionBlocks({ blocks, url, onCopy }: InstructionBlocksProps) {
  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'text':
            return (
              <p key={i} className="text-xs text-foreground-light">
                <InlineContent parts={block.content} />
              </p>
            )
          case 'callout':
            return (
              <p
                key={i}
                className={cn(
                  'text-xs',
                  block.variant === 'warning' ? 'text-warning' : 'text-foreground-light'
                )}
              >
                <InlineContent parts={block.content} />
              </p>
            )
          case 'command':
            return (
              <CodeBlock
                key={i}
                value={typeof block.value === 'function' ? block.value(url) : block.value}
                language="bash"
                focusable={false}
                // CodeBlock renders inline code without a className; force a block.
                className="block"
                onCopyCallback={() => onCopy('command')}
              />
            )
          case 'image': {
            const src = INSTRUCTION_ASSETS[block.asset]
            return src ? (
              <Image
                key={i}
                src={src}
                alt={block.alt}
                className="rounded border border-muted w-full"
              />
            ) : null
          }
        }
      })}
    </div>
  )
}
