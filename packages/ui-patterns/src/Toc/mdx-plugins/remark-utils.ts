// import type { RootContent } from 'mdast'

export function flattenNode(node: any): string {
  if ('children' in node) return node.children.map((child: any) => flattenNode(child)).join('')

  if ('value' in node) return node.value

  return ''
}
