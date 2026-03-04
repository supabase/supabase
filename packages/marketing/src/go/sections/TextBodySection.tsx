'use client'

import React from 'react'
import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'

import type { GoTextBodySection } from '../schemas'
import { slugify } from './TableOfContents'

function getTextContent(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getTextContent).join('')
  if (React.isValidElement(node) && node.props) {
    return getTextContent((node.props as { children?: React.ReactNode }).children)
  }
  return ''
}

const headingWithId =
  (Tag: 'h1' | 'h2' | 'h3'): Components[typeof Tag] =>
  ({ children }) => {
    const text = getTextContent(children)
    const id = slugify(text)
    return (
      <Tag id={id} className="scroll-mt-24">
        {children}
      </Tag>
    )
  }

const components: Components = {
  h1: headingWithId('h1'),
  h2: headingWithId('h2'),
  h3: headingWithId('h3'),
}

export default function TextBodySection({ section }: { section: GoTextBodySection }) {
  return (
    <article className="prose prose-headings:text-foreground prose-p:text-foreground-light prose-strong:text-foreground prose-li:text-foreground-light prose-a:text-brand-link prose-a:decoration-brand-link max-w-none">
      <ReactMarkdown components={components}>{section.content}</ReactMarkdown>
    </article>
  )
}
