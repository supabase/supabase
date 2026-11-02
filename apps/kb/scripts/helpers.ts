import { visit } from 'unist-util-visit'

import { BASE_PATH } from '../src/lib/constants.ts'
import type { MarkdownTree } from './generate-markdown.ts'

/**
 * Drops the custom anchor from headings like `## My heading [#my-anchor]`. The
 * anchor only matters to the rendered page; left in, it leaks into the exported
 * markdown and from there into search embeddings.
 */
export function stripHeadingCustomIds(tree: MarkdownTree) {
  visit(tree, 'heading', (node) => {
    const last = node.children.at(-1)
    if (last?.type !== 'text') return
    const text = last.value.trimEnd()
    const anchorStart = text.lastIndexOf('[#')
    if (anchorStart === -1 || !text.endsWith(']')) return
    last.value = text.slice(0, anchorStart).trimEnd()
  })
}

/**
 * Prefixes every root-relative link with the KB base path (unless it already
 * has it) and the given absolute base URL — the AST equivalent of apps/docs'
 * `addBaseUrlPrefix()`.
 */
export function addBaseUrlPrefix(tree: MarkdownTree, baseUrl: string) {
  visit(tree, 'link', (node) => {
    if (!node.url.startsWith('/') || node.url.startsWith('//')) return
    const withBase =
      node.url === BASE_PATH || node.url.startsWith(`${BASE_PATH}/`)
        ? node.url
        : `${BASE_PATH}${node.url}`
    node.url = `${baseUrl}${withBase}`
  })
}
