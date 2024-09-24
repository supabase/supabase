import { afterAll, beforeAll, describe, it, expect } from 'vitest'

import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { mdxjs } from 'micromark-extension-mdxjs'

import { codeSampleRemark } from './CodeSample'

const transformWithMock = codeSampleRemark({
  fetchFromGitHub: (_params) => Promise.resolve('ok'),
})

let env: NodeJS.Process['env']

describe('$CodeSample', () => {
  beforeAll(() => {
    env = process.env
    process.env = { NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA: '1234567890' }
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
  \`\`\`
</CodeSampleWrapper>

Some more text.
`.trimStart()

    expect(output).toEqual(expected)
  })
})
