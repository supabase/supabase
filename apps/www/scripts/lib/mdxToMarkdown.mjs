// @ts-check

import { remark } from 'remark'
import remarkGfm from 'remark-gfm'
import remarkMdx from 'remark-mdx'
import { SKIP, visit } from 'unist-util-visit'

function getJsxAttr(node, name) {
  const attr = (node.attributes ?? []).find((a) => a.type === 'mdxJsxAttribute' && a.name === name)
  return typeof attr?.value === 'string' ? attr.value : ''
}

function flattenChildText(nodes) {
  const parts = []
  for (const node of nodes) {
    if (node.type === 'text' || node.type === 'inlineCode') parts.push(node.value)
    else if (node.children) parts.push(flattenChildText(node.children))
  }
  return parts.join('')
}

const text = (value) => ({ type: 'text', value })
const para = (children) => ({ type: 'paragraph', children })
const strong = (children) => ({ type: 'strong', children })
const emph = (children) => ({ type: 'emphasis', children })
const blockquote = (children) => ({ type: 'blockquote', children })

// Unknown JSX must not become a `paragraph` (block) inside an inline parent.
function unwrap(node) {
  const children = node.children ?? []
  if (node.type === 'mdxJsxTextElement') return text(flattenChildText(children))
  return children.length > 0 ? para(children) : text('')
}

const REWRITES = {
  Img: (node) => {
    const src = getJsxAttr(node, 'src')
    return src ? { type: 'image', url: src, alt: getJsxAttr(node, 'alt'), title: null } : text('')
  },
  img: (node) => REWRITES.Img(node),

  Admonition: (node) => {
    const label = (getJsxAttr(node, 'type') || 'note').toUpperCase()
    return blockquote([para([strong([text(label)])]), ...(node.children ?? [])])
  },

  Quote: (node) => {
    const caption = getJsxAttr(node, 'caption')
    const attribution = caption ? [para([emph([text(`— ${caption}`)])])] : []
    return blockquote([...(node.children ?? []), ...attribution])
  },

  BlogCollapsible: (node) => {
    const title = getJsxAttr(node, 'title')
    const heading = title ? [para([strong([text(title)])])] : []
    return blockquote([...heading, ...(node.children ?? [])])
  },

  Link: (node) => {
    const href = getJsxAttr(node, 'href')
    if (!href) return unwrap(node)
    return { type: 'link', url: href, title: null, children: node.children ?? [] }
  },
  a: (node) => REWRITES.Link(node),

  Subtitle: (node) => strong(node.children ?? []),
  Badge: (node) => strong(node.children ?? []),

  Avatar: (node) => (node.type === 'mdxJsxTextElement' ? text('') : para([])),
}

function rewriteJsxNode(node) {
  return REWRITES[node.name]?.(node) ?? unwrap(node)
}

function transformMdxNodes() {
  return (tree, file) => {
    const unknownNames = new Set()
    visit(tree, (node, index, parent) => {
      if (parent == null || index == null) return

      if (
        node.type === 'mdxFlowExpression' ||
        node.type === 'mdxTextExpression' ||
        node.type === 'mdxjsEsm'
      ) {
        parent.children.splice(index, 1)
        return [SKIP, index]
      }

      if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') return

      if (node.name && !(node.name in REWRITES)) unknownNames.add(node.name)
      parent.children[index] = rewriteJsxNode(node)
      return [SKIP, index]
    })
    if (unknownNames.size > 0) {
      file.message(`Unknown JSX components stripped: ${[...unknownNames].sort().join(', ')}`)
    }
  }
}

const processor = remark().use(remarkMdx).use(remarkGfm).use(transformMdxNodes).data('settings', {
  bullet: '-',
  fences: true,
  incrementListMarker: false,
  rule: '-',
})

export async function mdxBodyToMarkdown(rawBody) {
  const file = await processor.process(rawBody)
  for (const msg of file.messages) console.warn(`  ⚠ ${msg.message}`)
  return String(file)
}
