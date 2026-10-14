import { createMarkdownProcessor } from '@astrojs/markdown-remark'
import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri'
import { fromHtml } from 'hast-util-from-html'
import { codeBlockTheme } from 'ui-patterns/CodeBlock/CodeBlock.theme'
import { visit } from 'unist-util-visit'
import { describe, expect, it } from 'vitest'

import { sharedCodeBlock } from './shiki-code-block'

type HastRoot = ReturnType<typeof fromHtml>
type HastNode = HastRoot | HastRoot['children'][number]
type HastElement = Extract<HastNode, { type: 'element' }>

const SOURCE = `const html = "<b>it's" + '&amp;'\n\n// "done"`
const MARKDOWN = `Intro\n\n\`\`\`js\n${SOURCE}\n\`\`\`\n\n\`\`\`\nplain <text>\n\`\`\`\n`
const SHIKI_CONFIG = { theme: codeBlockTheme, transformers: [sharedCodeBlock] }

// .md renders through sätteri, .mdx through the unified pipeline
const PROCESSORS = {
  satteri: () => createSatteriMarkdownProcessor({ shikiConfig: SHIKI_CONFIG }),
  unified: () => createMarkdownProcessor({ shikiConfig: SHIKI_CONFIG }),
}

// queried as hast because sätteri's native binding can't run under jsdom
const findAll = (node: HastNode, test: (element: HastElement) => boolean) => {
  const found: Array<HastElement> = []
  visit(node, 'element', (element: HastElement) => {
    if (test(element)) found.push(element)
  })
  return found
}

const hasClass = (name: string) => (element: HastElement) =>
  Array.isArray(element.properties.className) && element.properties.className.includes(name)

const textOf = (node: HastNode): string =>
  node.type === 'text' ? node.value : 'children' in node ? node.children.map(textOf).join('') : ''

describe.each(Object.entries(PROCESSORS))('shared code block through %s', (_, create) => {
  it('renders the shared frame with exact copy source and no shiki pre', async () => {
    const { code } = await (await create()).render(MARKDOWN)
    const tree = fromHtml(code, { fragment: true })
    const [frame, plain] = findAll(tree, hasClass('shiki'))
    const label = (element: HastElement) => findAll(element, hasClass('code-scroll'))[0]

    expect(findAll(tree, hasClass('astro-code'))).toHaveLength(0)
    expect(findAll(tree, (element) => element.tagName === 'pre')).toHaveLength(2)
    expect(findAll(tree, (element) => element.tagName === 'button')).toHaveLength(0)
    expect(frame.properties.dataCodeSource).toBe(SOURCE)
    expect(findAll(frame, hasClass('code-line-content')).map(textOf).join('\n')).toBe(SOURCE)
    expect(label(frame).properties.ariaLabel).toBe('JavaScript, 3 lines')
    expect(textOf(findAll(frame, hasClass('s-k'))[0])).toBe('const')
    expect(findAll(frame, (element) => 'style' in element.properties)).toHaveLength(0)
    expect(plain.properties.dataCodeSource).toBe('plain <text>')
    expect(label(plain).properties.ariaLabel).toBe('1 line')
  })
})
