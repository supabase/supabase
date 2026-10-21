import { toString } from 'mdast-util-to-string'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

import type { ParsedPage, Section } from './types.js'

const processor = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']).use(remarkGfm)

/**
 * Types are derived from the processor's output rather than imported from `mdast`:
 * the docs app pins `@types/mdast` v3, while `remark-parse` v11 resolves its own
 * (structurally incompatible) v4 types.
 */
export type Root = ReturnType<typeof processor.parse>
type Content = Root['children'][number]
type Heading = Extract<Content, { type: 'heading' }>
type Nodes = Root | Content

export function parseMarkdownAst(markdown: string): Root {
  return processor.parse(markdown)
}

/**
 * Convert a node to plain text. Like mdast-util-to-string but keeps words apart
 * for block containers (list items on their own line, table cells separated by " | ").
 */
export function nodeToText(node: Nodes): string {
  switch (node.type) {
    case 'tableRow':
      return node.children.map((cell) => toString(cell).trim()).join(' | ')
    case 'table':
    case 'list':
    case 'listItem':
    case 'blockquote':
      return (node.children as Nodes[]).map(nodeToText).filter(Boolean).join('\n')
    default:
      return toString(node).trim()
  }
}

export function extractTitle(tree: Root): string {
  const h1 = tree.children.find(
    (node): node is Heading => node.type === 'heading' && node.depth === 1
  )
  return h1 ? nodeToText(h1) : ''
}

/** The first paragraph of the document (used as the page excerpt), or ''. */
export function extractExcerpt(tree: Root): string {
  const paragraph = tree.children.find((node) => node.type === 'paragraph')
  return paragraph ? nodeToText(paragraph) : ''
}

function isIgnored(node: Content): boolean {
  return (
    node.type === 'yaml' ||
    node.type === 'thematicBreak' ||
    node.type === 'html' ||
    node.type === 'definition'
  )
}

/**
 * Split the document into sections: one per heading, each with the text below it
 * (until the next heading) and the path of ancestor headings leading to it.
 */
export function extractSections(tree: Root): Section[] {
  const sections: Section[] = []
  const stack: Array<{ text: string; level: number }> = []
  let current: Section | null = null
  let body: string[] = []

  const flush = () => {
    if (current) {
      current.content = body.join('\n\n').trim()
      if (current.heading || current.content) sections.push(current)
    }
    body = []
  }

  for (const node of tree.children) {
    if (isIgnored(node)) continue

    if (node.type === 'heading') {
      flush()
      while (stack.length && stack[stack.length - 1].level >= node.depth) stack.pop()
      const text = nodeToText(node)
      stack.push({ text, level: node.depth })
      current = {
        heading: text,
        level: node.depth,
        headingPath: stack.map((s) => s.text),
        content: '',
      }
      continue
    }

    if (!current) current = { heading: '', level: 0, headingPath: [], content: '' }
    const text = nodeToText(node)
    if (text) body.push(text)
  }

  flush()
  return sections
}

export function parsePage(markdown: string): ParsedPage {
  const tree = parseMarkdownAst(markdown)
  return {
    title: extractTitle(tree),
    excerpt: extractExcerpt(tree),
    sections: extractSections(tree),
  }
}
