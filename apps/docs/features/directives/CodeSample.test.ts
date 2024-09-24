import { afterAll, beforeAll, describe, it, expect, vi } from 'vitest'

import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import { toMarkdown } from 'mdast-util-to-markdown'
import { mdxjs } from 'micromark-extension-mdxjs'

import { _createElidedLine, codeSampleRemark } from './CodeSample'

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

<CodeSampleWrapper source="https://github.com/supabase/supabase/blob/1234567890/examples/_internal/fixtures/javascript.js">
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

<CodeSampleWrapper source="https://github.com/supabase/supabase/blob/1234567890/examples/_internal/fixtures/javascript.js">
  \`\`\`javascript
  const A = 'A'
  const B = 3

  // ...

  function max(a, b) {
    return a > b ? a : b
  }

  // ...
  \`\`\`
</CodeSampleWrapper>

Some more text.
`.trimStart()

    expect(output).toEqual(expected)
  })

  it('should handle paths without leading slash', async () => {
    const markdown = `
# Embed code sample

<$CodeSample path="_internal/fixtures/javascript.js" lines={[[1, -1]]} />

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

<CodeSampleWrapper source="https://github.com/supabase/supabase/blob/1234567890/examples/_internal/fixtures/javascript.js">
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

<CodeSampleWrapper source="https://github.com/supabase/supabase/blob/1234567890/examples/_internal/fixtures/python.py">
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

  it('should preserve meta as code block meta if given', async () => {
    const markdown = `
# Embed code sample

<$CodeSample
  path="/_internal/fixtures/javascript.js"
  lines={[[1, 2], [8, 10]]}
  meta="utils/client.ts"
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

<CodeSampleWrapper source="https://github.com/supabase/supabase/blob/1234567890/examples/_internal/fixtures/javascript.js">
  \`\`\`javascript utils/client.ts
  const A = 'A'
  const B = 3

  // ...

  function max(a, b) {
    return a > b ? a : b
  }

  // ...
  \`\`\`
</CodeSampleWrapper>

Some more text.
`.trimStart()

    expect(output).toEqual(expected)
  })

  it('should wrap entire CodeHike if CodeHike descendant', async () => {
    const markdown = `
# Embed code sample

<CH.Code>

<$CodeSample
  path="/_internal/fixtures/javascript.js"
  lines={[[1, -1]]}
  meta="utils/client.ts"
/>

</CH.Code>

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

<CodeSampleWrapper source="https://github.com/supabase/supabase/blob/1234567890/examples/_internal/fixtures/javascript.js">
  <CH.Code>
    \`\`\`javascript utils/client.ts
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
  </CH.Code>
</CodeSampleWrapper>

Some more text.
`.trimStart()

    expect(output).toEqual(expected)
  })

  it('should merge multiple CodeSampleWrappers', async () => {
    const markdown = `
# Embed code sample

<CH.Code>

<$CodeSample
path="/_internal/fixtures/javascript.js"
lines={[[1, -1]]}
meta="utils/client.ts"
/>

<$CodeSample
path="/_internal/fixtures/python.py"
lines={[[1, -1]]}
meta="utils/python.py"
/>

</CH.Code>

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

<CodeSampleWrapper source={['https://github.com/supabase/supabase/blob/1234567890/examples/_internal/fixtures/javascript.js', 'https://github.com/supabase/supabase/blob/1234567890/examples/_internal/fixtures/python.py']}>
  <CH.Code>
    \`\`\`javascript utils/client.ts
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

    \`\`\`python utils/python.py
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
  </CH.Code>
</CodeSampleWrapper>

Some more text.
`.trimStart()

    expect(output).toEqual(expected)
  })

  it('should correctly replace multiple CodeHikes', async () => {
    const markdown = `
# Embed code sample

<CH.Code>

<$CodeSample
  path="/_internal/fixtures/javascript.js"
  lines={[[1, -1]]}
  meta="utils/client1.ts"
/>

<$CodeSample
  path="/_internal/fixtures/javascript.js"
  lines={[[1, -1]]}
  meta="utils/client2.ts"
/>

</CH.Code>

Another one:

<CH.Code>

<$CodeSample
  path="/_internal/fixtures/javascript.js"
  lines={[[1, -1]]}
  meta="utils/client3.ts"
/>

</CH.Code>

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

<CodeSampleWrapper source="https://github.com/supabase/supabase/blob/1234567890/examples/_internal/fixtures/javascript.js">
  <CH.Code>
    \`\`\`javascript utils/client1.ts
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

    \`\`\`javascript utils/client2.ts
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
  </CH.Code>
</CodeSampleWrapper>

Another one:

<CodeSampleWrapper source="https://github.com/supabase/supabase/blob/1234567890/examples/_internal/fixtures/javascript.js">
  <CH.Code>
    \`\`\`javascript utils/client3.ts
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
  </CH.Code>
</CodeSampleWrapper>

Some more text.
`.trimStart()

    expect(output).toEqual(expected)
  })
})

describe('_createElidedLine', () => {
  it('properly preserves indentation', () => {
    const content = `
def add_numbers(a, b):
    return a + b

def concat_strings(str1, str2):
    return str1 + str2

# Test cases
if __name__ == "__main__":
    result1 = add_numbers(3, 5)
    print(f"add_numbers(3, 5) = {result1}")  # Expected output: 8
`.trim()

    const output = _createElidedLine('python', content.split('\n'), 10, 10)

    const expected = '\n    // ...\n'
    expect(output).toEqual(expected)
  })

  it('properly uses comment format in JSX and TSX', () => {
    const content = `
const one = 'one'
const two = 'two'

function One() {
  return (
    <div>
      <One />
      <Two />
    </div>
  )
}
`.trim()

    const output = _createElidedLine('tsx', content.split('\n'), 4, -1)

    const expected = '\n// ...\n'
    expect(output).toEqual(expected)

    const outputJsx = _createElidedLine('tsx', content.split('\n'), 8, -1)
    const expectedJsx = '\n      {/* ... */}\n'
    expect(outputJsx).toEqual(expectedJsx)
  })
})
