import type { PhrasingContent, RootContent } from 'mdast'
import type { Mark, Node } from 'prosemirror-model'

import { markdownSchema as schema } from '../schema'
import type { MarkdownBlockExtension } from '../types'
import { getSource, isSupportedNode, parseMarkdown } from './parse'

function importInline(nodes: PhrasingContent[], marks: readonly Mark[] = []): Node[] {
  return nodes.flatMap((node): Node[] => {
    if (node.type === 'strong' || node.type === 'emphasis') {
      return importInline(
        node.children,
        schema.marks[node.type === 'strong' ? 'strong' : 'em'].create().addToSet(marks)
      )
    }
    if (node.type === 'link')
      return importInline(
        node.children,
        schema.marks.link.create({ href: node.url, title: node.title }).addToSet(marks)
      )
    if (node.type === 'break') return [schema.nodes.hard_break.create()]
    if (node.type === 'text' || node.type === 'inlineCode') {
      const result: Node[] = []
      node.value.split('\n').forEach((line, index) => {
        if (index > 0) result.push(schema.nodes.hard_break.create({ soft: true }))
        if (line)
          result.push(
            schema.text(
              line,
              node.type === 'inlineCode' ? schema.marks.code.create().addToSet(marks) : marks
            )
          )
      })
      return result
    }
    return []
  })
}

function importBlock(
  node: RootContent,
  source: string,
  extensions: readonly MarkdownBlockExtension[]
): Node {
  const raw = getSource(node, source)
  for (const extension of extensions) {
    const parsed = extension.parse(node, raw)
    if (parsed) return schema.nodes.embedded_block.create({ kind: extension.type, ...parsed })
  }
  if (!isSupportedNode(node))
    return schema.nodes.embedded_block.create({ kind: 'source', value: raw, language: 'markdown' })
  switch (node.type) {
    case 'paragraph':
      return schema.nodes.paragraph.create(null, importInline(node.children))
    case 'heading':
      return schema.nodes.heading.create({ level: node.depth }, importInline(node.children))
    case 'code':
      return schema.nodes.embedded_block.create({
        kind: 'code',
        value: node.value,
        language: node.lang ?? '',
      })
    case 'blockquote':
      return schema.nodes.blockquote.create(
        null,
        node.children.map((child) => importBlock(child, source, extensions))
      )
    case 'list':
      return schema.nodes[node.ordered ? 'ordered_list' : 'bullet_list'].create(
        { order: node.start ?? 1 },
        node.children.map((item) =>
          schema.nodes.list_item.create(
            null,
            item.children.map((child) => importBlock(child, source, extensions))
          )
        )
      )
    default:
      return schema.nodes.embedded_block.create({
        kind: 'source',
        value: raw,
        language: 'markdown',
      })
  }
}

export function importMarkdown(source: string, extensions: readonly MarkdownBlockExtension[] = []) {
  const document = parseMarkdown(source)
  const children = document.children.map((node) => importBlock(node, source, extensions))
  return schema.nodes.doc.create(
    null,
    children.length ? children : [schema.nodes.paragraph.create()]
  )
}
