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

  it('should error when required variable is missing', async () => {
    const markdown = `
# Embed partial

<$Partial path="/_fixtures/variables.mdx" />

Some more text.
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    await expect(partialsRemark()(mdast)).rejects.toThrowError(
      /Missing required variable in \$Partial ".*variables\.mdx": "var"/
    )
  })

  it('should error when unexpected variable is provided', async () => {
    const markdown = `
# Embed partial

<$Partial path="/_fixtures/variables.mdx" variables={{ "var": "correct", "extra": "unexpected" }} />

Some more text.
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    await expect(partialsRemark()(mdast)).rejects.toThrowError(
      /Unexpected variable in \$Partial ".*variables\.mdx": "extra"/
    )
  })

  it('should error with detailed message for multiple missing variables', async () => {
    const markdown = `
# Embed partial

<$Partial path="/_fixtures/multiple-variables.mdx" variables={{ "var1": "value1" }} />

Some more text.
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    await expect(partialsRemark()(mdast)).rejects.toThrowError(
      /Missing required variables.*"var2".*"var3".*Expected variables.*"var1".*"var2".*"var3".*Provided variable: "var1"/s
    )
  })

  it('should error with detailed message for multiple unexpected variables', async () => {
    const markdown = `
# Embed partial

<$Partial path="/_fixtures/variables.mdx" variables={{ "var": "correct", "extra1": "wrong", "extra2": "also wrong" }} />

Some more text.
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    await expect(partialsRemark()(mdast)).rejects.toThrowError(
      /Unexpected variables.*"extra1".*"extra2".*Expected variable: "var".*Provided variables.*"var".*"extra1".*"extra2"/s
    )
  })

  it('should succeed when all variables match exactly', async () => {
    const markdown = `
# Embed partial

<$Partial path="/_fixtures/multiple-variables.mdx" variables={{ "var1": "first", "var2": "second", "var3": "third" }} />

Some more text.
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    const transformed = await partialsRemark()(mdast)
    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    expect(output).toContain('first')
    expect(output).toContain('second')
    expect(output).toContain('third')
  })

  it('should support hyphenated variable names', async () => {
    const markdown = `
# Embed partial

<$Partial path="/_fixtures/hyphenated-variables.mdx" variables={{ "my-var": "hyphenated value", "another_var": "underscored value", "myVar123": "alphanumeric value" }} />

Some more text.
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    const transformed = await partialsRemark()(mdast)
    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    expect(output).toContain('hyphenated value')
    expect(output).toContain('underscored value')
    expect(output).toContain('alphanumeric value')
  })

  it('should error when hyphenated variable is missing', async () => {
    const markdown = `
# Embed partial

<$Partial path="/_fixtures/hyphenated-variables.mdx" variables={{ "my-var": "value" }} />

Some more text.
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    await expect(partialsRemark()(mdast)).rejects.toThrowError(
      /Missing required variables.*"another_var".*"myVar123".*Expected variables.*"my-var".*"another_var".*"myVar123".*Provided variable: "my-var"/s
    )
  })
})
