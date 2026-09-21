import type { Nodes, RootContent } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'

export function parseMarkdown(source: string) {
  return fromMarkdown(source, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] })
}

export function getSource(node: RootContent, source: string) {
  return source.slice(node.position?.start.offset ?? 0, node.position?.end.offset ?? source.length)
}

export function isSafeLink(url: string) {
  // Reject control-character obfuscation as well as executable/data protocols.
  if (/[\u0000-\u0020\u007f]/.test(url)) return false
  const protocol = /^([a-z][a-z\d+.-]*):/i.exec(url)?.[1]?.toLowerCase()
  return !protocol || ['http', 'https', 'mailto', 'tel'].includes(protocol)
}

export function isSupportedNode(node: Nodes): boolean {
  switch (node.type) {
    case 'text':
    case 'inlineCode':
    case 'break':
      return true
    case 'code':
      return !node.meta
    case 'link':
      return isSafeLink(node.url) && node.children.every(isSupportedNode)
    case 'listItem':
      return (
        node.checked == null &&
        node.children[0]?.type === 'paragraph' &&
        node.children.every(isSupportedNode)
      )
    case 'paragraph':
    case 'heading':
    case 'blockquote':
    case 'list':
    case 'strong':
    case 'emphasis':
      return node.children.every(isSupportedNode)
    default:
      return false
  }
}
