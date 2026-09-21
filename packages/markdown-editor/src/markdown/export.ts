import type { BlockContent, PhrasingContent } from 'mdast'
import { toMarkdown } from 'mdast-util-to-markdown'
import type { Node } from 'prosemirror-model'

import type { MarkdownBlockExtension } from '../types'

function exportInline(nodes: readonly Node[]): PhrasingContent[] {
  const result: PhrasingContent[] = []
  for (let index = 0; index < nodes.length; ) {
    const child = nodes[index]
    // Keep the longest shared mark outside shorter runs, so nested formatting
    // does not emit adjacent closing/opening delimiters for the same mark.
    const run = child.marks
      .filter((mark) => mark.type.name !== 'code')
      .map((mark) => {
        let end = index + 1
        while (end < nodes.length && mark.isInSet(nodes[end].marks)) end++
        return { mark, end }
      })
      .sort((a, b) => b.end - a.end)[0]
    if (run) {
      const { mark, end } = run
      const children = exportInline(
        nodes.slice(index, end).map((node) => node.mark(mark.removeFromSet(node.marks)))
      )
      if (mark.type.name === 'link')
        result.push({ type: 'link', url: mark.attrs.href, title: mark.attrs.title, children })
      else result.push({ type: mark.type.name === 'strong' ? 'strong' : 'emphasis', children })
      index = end
      continue
    }
    index++
    if (child.type.name === 'hard_break') {
      result.push(child.attrs.soft ? { type: 'text', value: '\n' } : { type: 'break' })
      continue
    }
    if (child.isText)
      result.push({
        type: child.marks.some((mark) => mark.type.name === 'code') ? 'inlineCode' : 'text',
        value: child.text ?? '',
      })
  }
  return result
}

function exportBlocks(node: Node, extensions: readonly MarkdownBlockExtension[]): BlockContent[] {
  const blocks: BlockContent[] = []
  node.forEach((child) => {
    switch (child.type.name) {
      case 'paragraph':
        blocks.push({ type: 'paragraph', children: exportInline(child.content.content) })
        break
      case 'heading':
        blocks.push({
          type: 'heading',
          depth: child.attrs.level,
          children: exportInline(child.content.content),
        })
        break
      case 'blockquote':
        blocks.push({ type: 'blockquote', children: exportBlocks(child, extensions) })
        break
      case 'bullet_list':
      case 'ordered_list': {
        const items: Extract<BlockContent, { type: 'list' }>['children'] = []
        child.forEach((item) =>
          items.push({ type: 'listItem', spread: false, children: exportBlocks(item, extensions) })
        )
        blocks.push({
          type: 'list',
          ordered: child.type.name === 'ordered_list',
          start: child.attrs.order ?? null,
          spread: false,
          children: items,
        })
        break
      }
      case 'embedded_block': {
        const { kind, value, language } = child.attrs
        if (kind === 'code') blocks.push({ type: 'code', value, lang: language || null })
        else if (kind === 'source') blocks.push({ type: 'html', value })
        else {
          const extension = extensions.find((item) => item.type === kind)
          if (!extension) throw new Error(`Missing Markdown block extension: ${kind}`)
          blocks.push({ type: 'html', value: extension.serialize({ value, language }) })
        }
      }
    }
  })
  return blocks
}

export function exportMarkdown(document: Node, extensions: readonly MarkdownBlockExtension[] = []) {
  return toMarkdown(
    { type: 'root', children: exportBlocks(document, extensions) },
    { bullet: '-', fences: true, listItemIndent: 'one' }
  ).replace(/\n$/, '')
}
