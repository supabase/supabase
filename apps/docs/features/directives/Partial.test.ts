import { describe, it, expect } from 'vitest'

import { mdxToMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'

import { partialsRemark } from './Partial'
import { fromDocsMarkdown } from './utils.server'

describe('$Partial', () => {
  it('should replace partial marker with partial contents', async () => {
    const markdown = `
# Embed partial

<$Partial path="/_fixtures/test.mdx" />

Some more text.
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    const transformed = await partialsRemark()(mdast)
    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    const expected = `
# Embed partial

Here is some content to embed as a partial.

## A heading

Some more stuff, including:

*   A list
*   With two items

And some custom components:

<Admonition type="note">
  Some stuff.

  In two paragraphs.
</Admonition>

<Component />

An entire paragraph: It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness, it was the epoch of belief, it was the epoch of incredulity, it was the season of Light, it was the season of Darkness, it was the spring of hope, it was the winter of despair, we had everything before us, we had nothing before us, we were all going direct to Heaven, we were all going direct the other way...

Some more text.
`.trimStart()

    expect(output).toEqual(expected)
  })

  it('should replace nested partials', async () => {
    const markdown = `
# Embed partial

<$Partial path="/_fixtures/nested1.mdx" />

Some more text.
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    const transformed = await partialsRemark()(mdast)
    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    const expected = `
# Embed partial

First level of nesting:

{/* prettier-ignore */}

Second level of nesting.

Some more text.
`.trimStart()

    expect(output).toEqual(expected)
  })

  it('should substitute variables', async () => {
    const markdown = `
# Embed partial

<$Partial path="/_fixtures/variables.mdx" variables={{ "var": "string replacement" }} />

Some more text.
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    const transformed = await partialsRemark()(mdast)

    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    const expected = `
# Embed partial

Here is a partial that takes a string replacement.

Some more text.
`.trimStart()

    expect(output).toEqual(expected)
  })

  it('should error on invalid substitutions', async () => {
    const markdown = `
# Embed partial

<$Partial path="/_fixtures/variables.mdx" variables={{ "var": [0, 1, 2, 3] }} />

Some more text.
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    await expect(partialsRemark()(mdast)).rejects.toThrowError(/valid JSON/)
  })
})
