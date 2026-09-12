import matter from 'gray-matter'
import type { Content, Parent, Root } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm'
import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { gfm } from 'micromark-extension-gfm'
import { mdxjs } from 'micromark-extension-mdxjs'
import { visit } from 'unist-util-visit'

import { markdownSchema } from './markdown-schema'

type JsxNode = MdxJsxFlowElement | MdxJsxTextElement
type ComponentHandler = (ctx: {
  props: Record<string, unknown>
  children: string
  node: JsxNode
}) => string

const PARSE_OPTIONS = {
  extensions: [mdxjs(), gfm()],
  mdastExtensions: [mdxFromMarkdown(), gfmFromMarkdown()],
}
const SERIALIZE_OPTIONS = {
  extensions: [mdxToMarkdown(), gfmToMarkdown()],
  bullet: '-' as const,
  listItemIndent: 'one' as const,
}

const parseMdx = (source: string): Root => fromMarkdown(source, PARSE_OPTIONS)
const serializeMdx = (tree: Parent): string => toMarkdown(tree as Root, SERIALIZE_OPTIONS)

const defaultHandler: ComponentHandler = ({ children }) => children

const isJsx = (n: Content): n is JsxNode =>
  n.type === 'mdxJsxFlowElement' || n.type === 'mdxJsxTextElement'

function propsFrom(node: JsxNode): Record<string, unknown> {
  const props: Record<string, unknown> = {}
  for (const attr of node.attributes) {
    if (attr.type !== 'mdxJsxAttribute') continue
    if (attr.value == null) props[attr.name] = true
    else if (typeof attr.value === 'string') props[attr.name] = attr.value
    else props[attr.name] = attr.value.value
  }
  return props
}

function applySchema(parent: Parent, schema: Record<string, ComponentHandler>): void {
  for (const child of parent.children as Content[]) {
    if ('children' in child) applySchema(child as Parent, schema)
  }
  const next: Content[] = []
  for (const child of parent.children as Content[]) {
    if (
      child.type === 'mdxFlowExpression' ||
      child.type === 'mdxTextExpression' ||
      child.type === 'mdxjsEsm'
    ) {
      continue
    }
    if (isJsx(child)) {
      const handler = schema[child.name ?? ''] ?? defaultHandler
      const children = serializeMdx({
        type: 'root',
        children: child.children as Root['children'],
      }).trim()
      const value = handler({ props: propsFrom(child), children, node: child })
      if (value) {
        next.push({ type: 'html', value } as Content)
      }
      continue
    }
    next.push(child)
  }
  parent.children = next as Parent['children']
}

function rewriteLibraryLinks(tree: Root): void {
  visit(tree, 'link', (node) => {
    if (!node.url.startsWith('/')) return
    if (node.url.startsWith('//')) return

    if (node.url.startsWith('/library/docs/')) {
      const [pathname, hash] = node.url.split('#')
      const withMd = pathname.endsWith('.md') ? pathname : `${pathname}.md`
      node.url = `https://supabase.com${withMd}${hash ? `#${hash}` : ''}`
      return
    }

    node.url = `https://supabase.com${node.url}`
  })
}

export function transformLibraryMdx(raw: string): string {
  const { content, data } = matter(raw)
  const tree = parseMdx(content)
  rewriteLibraryLinks(tree)
  applySchema(tree, markdownSchema)
  const body = serializeMdx(tree).trim()

  const headerParts: string[] = []
  if (data.title) headerParts.push(`# ${String(data.title)}`)
  if (data.description) headerParts.push(String(data.description))

  const header = headerParts.join('\n\n')
  return `${header ? `${header}\n\n${body}` : body}\n`
}
