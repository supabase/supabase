import type { ShikiConfig } from '@astrojs/markdown-remark'
import { fromHtml } from 'hast-util-from-html'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getTokenClassName } from 'ui-patterns/CodeBlock/CodeBlock.utils'
import {
  CodeBlockFrame,
  CodeBlockTokens,
  type CodeToken,
} from 'ui-patterns/CodeBlock/CodeBlockFrame'

type ShikiTransformer = NonNullable<ShikiConfig['transformers']>[number]

// fences astro highlights as plain text; the frame labels these by line count only
const PLAIN_LANGS = new Set(['plaintext', 'text', 'txt', 'plain'])

// replaces shiki's <pre> with the shared frame for both the .md (sätteri) and .mdx (unified)
// processors, which each take the first child of the returned root
export const sharedCodeBlock: ShikiTransformer = {
  name: 'kb-shared-code-block',
  root() {
    const lines = this.tokens.map((line) =>
      line.map(
        ({ content, color, fontStyle }): CodeToken => [content, getTokenClassName(color, fontStyle)]
      )
    )
    const lang = PLAIN_LANGS.has(this.options.lang) ? null : this.options.lang
    const html = renderToStaticMarkup(
      createElement(CodeBlockFrame, {
        lang,
        lineCount: lines.length,
        children: createElement(CodeBlockTokens, { lines, lineNumbers: true }),
      })
    )
    const [frame] = fromHtml(html, { fragment: true }).children
    if (frame?.type !== 'element') throw new Error('CodeBlockFrame rendered no root element')
    // copy text for CodeBlockEnhancements; never read back from the decorated dom
    frame.properties.dataCodeSource = this.source
    return { type: 'root', children: [frame] }
  },
}
