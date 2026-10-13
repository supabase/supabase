import { toString } from 'mdast-util-to-string'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import { unified } from 'unified'

const processor = unified().use(remarkParse).use(remarkFrontmatter, ['yaml']).use(remarkGfm)

/**
 * Types are derived from the processor's own output rather than imported from
 * `mdast` directly: this app pins `@types/mdast` v3 for its wider MDX pipeline,
 * while `remark-parse` v11 resolves its own (structurally incompatible) v4
 * types for its nested `@types/mdast` dependency.
 */
export type Root = ReturnType<typeof processor.parse>
/** Any child of the root node (paragraph, heading, list, table, ...). */
type Content = Root['children'][number]
type Heading = Extract<Content, { type: 'heading' }>
/** Union of every node type that can appear in the tree (root or content). */
type Nodes = Root | Content

export interface Section {
  /** Text of this section's heading ('' for text that appears before any heading). */
  heading: string
  /** 1..6, or 0 for text before any heading. */
  level: number
  /** Headings from the H1 down to this section, e.g. ['Users', 'Permanent and anonymous users']. */
  headingPath: string[]
  /** Plain text of everything under the heading until the next heading. */
  content: string
}

export interface ParsedPage {
  title: string
  excerpt: string
  sections: Section[]
}

/** Parse markdown into an mdast tree (GFM tables/lists + YAML frontmatter supported). */
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

/** The first H1 of the document, or '' if there is none. */
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

/** Nodes that carry no searchable text. */
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

    // Body text before the first heading gets a headless section.
    if (!current) current = { heading: '', level: 0, headingPath: [], content: '' }
    const text = nodeToText(node)
    if (text) body.push(text)
  }

  flush()
  return sections
}

/** Everything the ingester needs from one markdown file. */
export function parsePage(markdown: string): ParsedPage {
  const tree = parseMarkdownAst(markdown)
  return {
    title: extractTitle(tree),
    excerpt: extractExcerpt(tree),
    sections: extractSections(tree),
  }
}
