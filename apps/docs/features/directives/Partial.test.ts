import { mdxToMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { describe, expect, it } from 'vitest'

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

  it('should render an unprovided variable as an empty string', async () => {
    // The variables.mdx fixture reads "Here is a partial that takes a {{ .var }}."
    // When `var` is not provided, the `{{ .var }}` placeholder is replaced with
    // an empty string rather than throwing. The trailing " ." in the expected
    // output is the intended result: the placeholder is gone, leaving nothing
    // between "a" and the period.
    const markdown = `
# Embed partial

<$Partial path="/_fixtures/variables.mdx" />

Some more text.
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    const transformed = await partialsRemark()(mdast)
    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    // Note the empty gap where `{{ .var }}` used to be — this is deliberate.
    const expected = `
# Embed partial

Here is a partial that takes a .

Some more text.
`.trimStart()

    expect(output).toEqual(expected)
    // The placeholder must be fully removed, not left as literal `{{ .var }}`.
    expect(output).not.toContain('{{')
  })

  it('should ignore a variable that is not referenced in the partial', async () => {
    // The variables.mdx fixture only references `var`. Providing an additional
    // `extra` variable that the partial never uses is silently ignored rather
    // than throwing — `var` is substituted and `extra` leaves no trace.
    const markdown = `
# Embed partial

<$Partial path="/_fixtures/variables.mdx" variables={{ "var": "correct", "extra": "unused" }} />

Some more text.
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    const transformed = await partialsRemark()(mdast)
    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    expect(output).toContain('Here is a partial that takes a correct.')
    expect(output).not.toContain('unused')
  })

  it('should render only the unprovided variables as empty when some are provided', async () => {
    // The multiple-variables.mdx fixture reads:
    //   "This partial has {{ .var1 }}, {{ .var2 }}, and {{ .var3 }}."
    // Only `var1` is provided here, so `var2` and `var3` collapse to empty
    // strings while `var1` is substituted normally.
    const markdown = `
# Embed partial

<$Partial path="/_fixtures/multiple-variables.mdx" variables={{ "var1": "value1" }} />

Some more text.
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    const transformed = await partialsRemark()(mdast)
    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    // Provided variable is substituted; the two unprovided ones leave empty gaps.
    expect(output).toContain('This partial has value1, , and .')
    // No placeholder text survives for the unprovided variables.
    expect(output).not.toContain('{{')
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

  it('should render unprovided hyphenated variables as empty', async () => {
    // The hyphenated-variables.mdx fixture reads:
    //   "This partial has {{ .my-var }}, {{ .another_var }}, and {{ .myVar123 }}."
    // Only `my-var` is provided, so the underscore and alphanumeric variables
    // collapse to empty strings — confirming the empty-substitution behavior
    // applies to all supported variable name styles.
    const markdown = `
# Embed partial

<$Partial path="/_fixtures/hyphenated-variables.mdx" variables={{ "my-var": "value" }} />

Some more text.
`.trim()

    const mdast = fromDocsMarkdown(markdown)
    const transformed = await partialsRemark()(mdast)
    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    expect(output).toContain('This partial has value, , and .')
    expect(output).not.toContain('{{')
  })
})
