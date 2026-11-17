import type { Content, Parent, Root } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown, gfmToMarkdown } from 'mdast-util-gfm'
import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { gfm } from 'micromark-extension-gfm'
import { mdxjs } from 'micromark-extension-mdxjs'

/**
 * MDX -> markdown helpers shared by the markdown generators (guides,
 * reference-beta). Parse MDX to an mdast tree, replace each JSX component with
 * plain markdown through a schema of handlers, and serialize back.
 */

export type JsxNode = MdxJsxFlowElement | MdxJsxTextElement
export type Props = Record<string, unknown>

/**
 * A handler converts a single MDX component into a markdown string. It receives
 * the component's props, the already-serialized markdown of its children, and
 * the raw AST node (escape hatch for handlers that need to inspect structure).
 *
 * Any component not in the schema is treated as `({ children }) => children`,
 * i.e. the wrapper is dropped and its children are kept as-is.
 */
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

export const isJsx = (n: Content): n is JsxNode =>
  n.type === 'mdxJsxFlowElement' || n.type === 'mdxJsxTextElement'

export function propsFrom(node: JsxNode): Props {
  const props: Props = {}
  for (const attr of node.attributes) {
    if (attr.type !== 'mdxJsxAttribute') continue
    if (attr.value == null) props[attr.name] = true
    else if (typeof attr.value === 'string') props[attr.name] = attr.value
    else props[attr.name] = attr.value.value
  }
  return props
}

/**
 * Walks the tree bottom-up. For each JSX element, runs its schema handler (or
 * the default) and replaces the node with an `html` node holding the result.
 * The `html` type passes through `mdast-util-to-markdown` verbatim, so whatever
 * markdown the handler returns lands in the final output unchanged.
 */
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
