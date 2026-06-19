import { fromDocsMarkdown } from '~/features/directives/utils.server'
import type { Content, Paragraph, Root } from 'mdast'
import { gfmToMarkdown } from 'mdast-util-gfm'
import type { MdxJsxFlowElement } from 'mdast-util-mdx'
import { mdxToMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { describe, expect, it } from 'vitest'

import remarkMkDocsAdmonition from './remarkAdmonition'

function transformAndSerialize(markdown: string) {
  const mdast = fromDocsMarkdown(markdown)
  const transformed = remarkMkDocsAdmonition()(mdast)
  const output = toMarkdown(transformed, { extensions: [mdxToMarkdown(), gfmToMarkdown()] })
  const reparsed = fromDocsMarkdown(output)
  return { transformed, output, reparsed }
}

function getAdmonition(root: Root): MdxJsxFlowElement {
  const node = root.children[0]
  expect(node.type).toBe('mdxJsxFlowElement')
  return node as MdxJsxFlowElement
}

function getParagraph(node: Content): Paragraph {
  expect(node.type).toBe('paragraph')
  return node as Paragraph
}

describe('remarkMkDocsAdmonition', () => {
  it('wraps inline admonition content in a single paragraph', () => {
    const markdown = `!!! note "About Authentication"
 HubSpot deprecated their legacy API Keys in November 2022. The \`api_key\` option in this wrapper accepts a **Private App Access Token**, which is HubSpot's recommended authentication method. See [HubSpot Private Apps](https://developers.hubspot.com/docs/guides/apps/private-apps/overview) for setup instructions.`

    const { transformed, reparsed } = transformAndSerialize(markdown)

    const admonition = getAdmonition(transformed)
    expect(admonition.children).toHaveLength(1)
    getParagraph(admonition.children[0])

    const reparsedAdmonition = getAdmonition(reparsed)
    expect(reparsedAdmonition.children).toHaveLength(1)
    getParagraph(reparsedAdmonition.children[0])
  })

  it('keeps indented sibling blocks as separate children', () => {
    const markdown = `!!! note

    First indented paragraph.

    Second indented paragraph.`

    const { transformed } = transformAndSerialize(markdown)

    const admonition = getAdmonition(transformed)
    expect(admonition.children.length).toBeGreaterThanOrEqual(2)
    expect(admonition.children.every((child) => child.type === 'paragraph')).toBe(true)
  })
})
