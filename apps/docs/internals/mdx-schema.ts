import fs from 'node:fs/promises'
import path from 'node:path'
import { parsePartialVariables, substitutePartialVars } from '~/lib/partials.utils'
import matter from 'gray-matter'
import type { Content, Parent, Root } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm'
import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { gfm } from 'micromark-extension-gfm'
import { mdxjs } from 'micromark-extension-mdxjs'

const PARTIALS_DIR = path.join(process.cwd(), 'content', '_partials')

type JsxNode = MdxJsxFlowElement | MdxJsxTextElement
type Props = Record<string, unknown>

export type ComponentHandler = (ctx: { props: Props; children: string; node: JsxNode }) => string
export type ComponentSchema = Record<string, ComponentHandler>

const PARSE_OPTIONS = {
  extensions: [mdxjs(), gfm()],
  mdastExtensions: [mdxFromMarkdown(), gfmFromMarkdown()],
}
const SERIALIZE_OPTIONS = {
  extensions: [mdxToMarkdown(), gfmToMarkdown()],
  bullet: '-' as const,
  listItemIndent: 'one' as const,
}

export const parseMdx = (source: string): Root => fromMarkdown(source, PARSE_OPTIONS)
export const serializeMdx = (tree: Parent): string => toMarkdown(tree as Root, SERIALIZE_OPTIONS)

const defaultHandler: ComponentHandler = ({ children }) => children

const isJsx = (n: Content): n is JsxNode =>
  n.type === 'mdxJsxFlowElement' || n.type === 'mdxJsxTextElement'

function propsFrom(node: JsxNode): Props {
  const props: Props = {}
  for (const attr of node.attributes) {
    if (attr.type !== 'mdxJsxAttribute') continue
    if (attr.value == null) props[attr.name] = true
    else if (typeof attr.value === 'string') props[attr.name] = attr.value
    else props[attr.name] = attr.value.value
  }
  return props
}

function resolvePartialPath(partialPath: string): string {
  if (!partialPath.endsWith('.md') && !partialPath.endsWith('.mdx')) {
    throw new Error('Invalid $Partial path: path must end with .mdx or .md')
  }
  const resolved = path.join(PARTIALS_DIR, partialPath)
  if (!resolved.startsWith(PARTIALS_DIR)) {
    throw new Error(`Invalid $Partial path: path must be inside ${PARTIALS_DIR}`)
  }
  return resolved
}

export async function inlinePartials(parent: Parent): Promise<void> {
  const next: Content[] = []
  for (const child of parent.children as Content[]) {
    if (isJsx(child) && child.name === '$Partial') {
      const props = propsFrom(child)
      const partialPath = String(props.path ?? '')
      const variables = parsePartialVariables(props.variables)
      const resolvedPath = resolvePartialPath(partialPath)
      try {
        const raw = await fs.readFile(resolvedPath, 'utf8')
        const content = substitutePartialVars(matter(raw).content, variables)
        const subtree = parseMdx(content)
        await inlinePartials(subtree)
        next.push(...(subtree.children as Content[]))
      } catch {
        // missing or broken partials are silently dropped
      }
      continue
    }
    if ('children' in child) await inlinePartials(child as Parent)
    next.push(child)
  }
  parent.children = next as Parent['children']
}

export function applySchema(parent: Parent, schema: ComponentSchema): void {
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

      next.push({ type: 'html', value } as Content)
      continue
    }
    next.push(child)
  }
  parent.children = next as Parent['children']
}
