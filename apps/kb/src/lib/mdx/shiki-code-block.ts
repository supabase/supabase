import type { ShikiConfig } from '@astrojs/markdown-remark'
import { fromHtml } from 'hast-util-from-html'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { getTokenClassName } from 'ui-patterns/CodeBlock/CodeBlock.tokens'
import {
  CodeBlockFrame,
  CodeBlockTokens,
  type CodeToken,
} from 'ui-patterns/CodeBlock/CodeBlockFrame'
import { visit } from 'unist-util-visit'

type ShikiTransformer = NonNullable<ShikiConfig['transformers']>[number]

// the .md and .mdx processors keep only the first child of the root, so the frame is the only child
export const sharedCodeBlock: ShikiTransformer = {
  name: 'kb-shared-code-block',
  root() {
    const lines = this.tokens.map((line) =>
      line.map(
        ({ content, color, fontStyle }): CodeToken => [content, getTokenClassName(color, fontStyle)]
      )
    )
    // astro highlights these fences as plain text. the frame labels them by line count only
    const lang = ['plaintext', 'text', 'txt', 'plain'].includes(this.options.lang)
      ? null
      : this.options.lang
    const html = renderToStaticMarkup(
      createElement(CodeBlockFrame, {
        lang,
        lineCount: lines.length,
        children: createElement(CodeBlockTokens, { lines, lineNumbers: true }),
      })
    )
    const [frame] = fromHtml(html, { fragment: true }).children
    if (frame?.type !== 'element') throw new Error('CodeBlockFrame rendered no root element')
    // the positions refer to the rendered string, not the source file. they make the mdx sourcemaps incorrect
    visit(frame, (node) => {
      delete node.position
    })
    // CodeBlockControlsIsland copies this text. it does not read the text from the rendered dom
    frame.properties.dataCodeSource = this.source
    return { type: 'root', children: [frame] }
  },
}
