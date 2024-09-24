import { afterAll, beforeAll, describe, it, expect, vi } from 'vitest'

import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { mdxjs } from 'micromark-extension-mdxjs'

import { codeSampleRemark } from './CodeSample'

const fetchFromGitHubMock = vi.fn((_params) => Promise.resolve('ok'))
const transformWithMock = codeSampleRemark({
  fetchFromGitHub: fetchFromGitHubMock,
})

let env: NodeJS.Process['env']

describe('$CodeSample', () => {
  beforeAll(() => {
    env = process.env
    process.env = { NODE_ENV: 'test', NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: '1234567890' }
  })

  afterAll(() => {
    process.env = env
  })

  it('should replace code sample with source code', async () => {
    const markdown = `
# Embed code sample

<$CodeSample path="/_internal/fixtures/javascript.js" lines={[[1, -1]]} />

Some more text.
`.trim()

    const mdast = fromMarkdown(markdown, {
      mdastExtensions: [mdxFromMarkdown()],
      extensions: [mdxjs()],
    })
    const transformed = await transformWithMock(mdast)
    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    const expected = `
# Embed code sample

<CodeSampleWrapper source="https://github.com/supabase/supabase/blob/1234567890/_internal/fixtures/javascript.js">
  \`\`\`javascript
  const A = 'A'
  const B = 3

  function add(a, b) {
    return a + b
  }

  function max(a, b) {
    return a > b ? a : b
  }

  function min(a, b) {
    return a < b ? a : b
  }
  \`\`\`
</CodeSampleWrapper>

Some more text.
`.trimStart()

    expect(output).toEqual(expected)
  })

  it('should replace code sample and elide lines', async () => {
    const markdown = `
# Embed code sample

<$CodeSample path="/_internal/fixtures/javascript.js" lines={[[1, 2], [8, 10]]} />

Some more text.
`.trim()

    const mdast = fromMarkdown(markdown, {
      mdastExtensions: [mdxFromMarkdown()],
      extensions: [mdxjs()],
    })
    const transformed = await transformWithMock(mdast)
    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    const expected = `
# Embed code sample

<CodeSampleWrapper source="https://github.com/supabase/supabase/blob/1234567890/_internal/fixtures/javascript.js">
  \`\`\`javascript
  const A = 'A'
  const B = 3

  // [...]

  function max(a, b) {
    return a > b ? a : b
  }

  // [...]
  \`\`\`
</CodeSampleWrapper>

Some more text.
`.trimStart()

    expect(output).toEqual(expected)
  })

  it('should use correct language modifier', async () => {
    const markdown = `
# Embed code sample

<$CodeSample path="/_internal/fixtures/python.py" lines={[[1, -1]]} />

Some more text.
`.trim()

    const mdast = fromMarkdown(markdown, {
      mdastExtensions: [mdxFromMarkdown()],
      extensions: [mdxjs()],
    })
    const transformed = await transformWithMock(mdast)
    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    const expected = `
# Embed code sample

<CodeSampleWrapper source="https://github.com/supabase/supabase/blob/1234567890/_internal/fixtures/python.py">
  \`\`\`python
  PI = 3.14159
  E = 2.71828

  def add_numbers(a, b):
      return a + b

  def concat_strings(str1, str2):
      return str1 + str2

  # Test cases
  if __name__ == "__main__":
      result1 = add_numbers(3, 5)
      print(f"add_numbers(3, 5) = {result1}")  # Expected output: 8
  \`\`\`
</CodeSampleWrapper>

Some more text.
`.trimStart()

    expect(output).toEqual(expected)
  })

  it('should fetch external code samples remotely', async () => {
    const markdown = `
# Embed code sample

<$CodeSample
  external={true}
  org="supabase"
  repo="supabase"
  commit="68d5s42hvs7p342kl65ldk90dsafdsa"
  path="/path/to/file.ts"
  lines={[[1, -1]]}
/>

Some more text.
`.trim()

    const mdast = fromMarkdown(markdown, {
      mdastExtensions: [mdxFromMarkdown()],
      extensions: [mdxjs()],
    })
    const transformed = await transformWithMock(mdast)
    const output = toMarkdown(transformed, { extensions: [mdxToMarkdown()] })

    const expected = `
# Embed code sample

<CodeSampleWrapper source="https://github.com/supabase/supabase/blob/68d5s42hvs7p342kl65ldk90dsafdsa/path/to/file.ts">
  \`\`\`typescript
  ok
  \`\`\`
</CodeSampleWrapper>

Some more text.
`.trimStart()

    expect(fetchFromGitHubMock).toHaveBeenCalledTimes(1)
    expect(fetchFromGitHubMock).toHaveBeenCalledWith({
      org: 'supabase',
      repo: 'supabase',
      path: '/path/to/file.ts',
      branch: '68d5s42hvs7p342kl65ldk90dsafdsa',
      options: { onError: expect.any(Function), fetch: expect.any(Function) },
    })
    expect(output).toEqual(expected)
  })
})
