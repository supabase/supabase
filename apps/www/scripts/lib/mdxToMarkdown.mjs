// @ts-check

import remarkGfm from 'remark-gfm'
import remarkMdx from 'remark-mdx'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import { unified } from 'unified'
import { SKIP, visit } from 'unist-util-visit'

// MDX comments survive parse as expression nodes that round-trip into output.
function stripMdxComments(source) {
  return source.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
}

function getJsxAttr(node, name) {
  const attr = (node.attributes ?? []).find((a) => a.type === 'mdxJsxAttribute' && a.name === name)
  return typeof attr?.value === 'string' ? attr.value : ''
}

const KNOWN_COMPONENTS = new Set([
  'Img',
  'img',
  'Admonition',
  'Quote',
  'BlogCollapsible',
  'Link',
  'a',
  'Subtitle',
  'Badge',
  'Avatar',
])

function flattenChildText(nodes) {
  const parts = []
  for (const node of nodes) {
    if (node.type === 'text' || node.type === 'inlineCode') parts.push(node.value)
    else if (node.children) parts.push(flattenChildText(node.children))
  }
  return parts.join('')
}

function rewriteJsxNode(node) {
  if (node.type !== 'mdxJsxFlowElement' && node.type !== 'mdxJsxTextElement') return null

  const name = node.name
  const children = node.children ?? []

  if (name === 'Img' || name === 'img') {
    const src = getJsxAttr(node, 'src')
    if (!src) return { type: 'text', value: '' }
    return { type: 'image', url: src, alt: getJsxAttr(node, 'alt'), title: null }
  }

  if (name === 'Admonition') {
    const variant = (getJsxAttr(node, 'type') || 'note').toUpperCase()
    const heading = {
      type: 'paragraph',
      children: [{ type: 'strong', children: [{ type: 'text', value: variant }] }],
    }
    return { type: 'blockquote', children: [heading, ...children] }
  }

  if (name === 'Quote') {
    const caption = getJsxAttr(node, 'caption')
    const captionPara = caption
      ? [
          {
            type: 'paragraph',
            children: [{ type: 'emphasis', children: [{ type: 'text', value: `— ${caption}` }] }],
          },
        ]
      : []
    return { type: 'blockquote', children: [...children, ...captionPara] }
  }

  if (name === 'BlogCollapsible') {
    const title = getJsxAttr(node, 'title')
    const titlePara = title
      ? [
          {
            type: 'paragraph',
            children: [{ type: 'strong', children: [{ type: 'text', value: title }] }],
          },
        ]
      : []
    return { type: 'blockquote', children: [...titlePara, ...children] }
  }

  if (name === 'Link' || name === 'a') {
    const href = getJsxAttr(node, 'href')
    if (!href) {
      return node.type === 'mdxJsxTextElement'
        ? { type: 'text', value: flattenChildText(children) }
        : { type: 'paragraph', children }
    }
    return { type: 'link', url: href, title: null, children }
  }

  if (name === 'Subtitle' || name === 'Badge') {
    return { type: 'strong', children }
  }

  if (name === 'Avatar') {
    return { type: 'text', value: '' }
  }

  // Unknown component: a flow `paragraph` is invalid inside an inline parent,
  // so for mdxJsxTextElement we flatten to text instead.
  if (node.type === 'mdxJsxTextElement') {
    return { type: 'text', value: flattenChildText(children) }
  }
  return children.length > 0 ? { type: 'paragraph', children } : { type: 'text', value: '' }
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

      if (node.name && !KNOWN_COMPONENTS.has(node.name)) unknownNames.add(node.name)

      const replacement = rewriteJsxNode(node)
      if (replacement) {
        parent.children[index] = replacement
        return [SKIP, index]
      }
    })
    if (unknownNames.size > 0) {
      file.message(`Unknown JSX components stripped: ${[...unknownNames].sort().join(', ')}`)
    }
  }
}

const processor = unified()
  .use(remarkParse)
  .use(remarkMdx)
  .use(remarkGfm)
  .use(transformMdxNodes)
  .use(remarkStringify, {
    bullet: '-',
    fences: true,
    incrementListMarker: false,
    rule: '-',
  })

export async function mdxBodyToMarkdown(rawBody) {
  const file = await processor.process(stripMdxComments(rawBody))
  for (const msg of file.messages) console.warn(`  ⚠ ${msg.message}`)
  return String(file)
}
